import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBusinessAccount } from '@/services/businessAccountService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const websiteSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? undefined : val))
  .pipe(z.string().url({ message: 'Invalid url' }).optional().nullable());

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  businessName: z.string().min(1),
  businessAddress: z.string().min(1),
  businessPhone: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  website: websiteSchema,
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      console.error('Business signup: invalid JSON body', err);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Business signup: validation failed', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Invalid signup data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      name,
      phone,
      businessName,
      businessAddress,
      businessPhone,
      taxId,
      website,
    } = parsed.data;

    const supabase = await createClient();

    // Get the site URL for redirects
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Step 1: Create auth user with Supabase
    console.log('[Business Signup] Attempting to create auth user for:', email);
    console.log('[Business Signup] Using redirect URL:', `${siteUrl}/auth/callback`);
    
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          name,
          phone_number: phone,
          role: 'BUSINESS_ACCOUNT',
        }
      }
    });

    if (signUpError) {
      const message = signUpError.message || 'Signup failed';
      console.error('[Business Signup] Supabase signup error:', signUpError);

      // Handle provider rate limiting gracefully
      if (message.toLowerCase().includes('for security purposes') || signUpError.status === 429) {
        return NextResponse.json(
          { error: 'rate_limit', message },
          { status: 429 }
        );
      }

      if (message.includes('already registered') || message.includes('User already exists')) {
         return NextResponse.json(
          { error: 'Email already in use', details: { fieldErrors: { email: ['Email already in use'] } } },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Step 2: Create user profile in users table (same as personal signup for consistency)
    // Use upsert to handle cases where auth user exists but profile doesn't
    console.log('[Business Signup] Creating user profile for:', data.user.id);
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: data.user.id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone_number: phone || null,
        role: 'customer', // Use 'customer' role in users table, business status tracked in business_accounts
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('[Business Signup] Failed to create user profile:', JSON.stringify(profileError, null, 2));
      // Clean up auth user so we don't leave dangling accounts
      try {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      } catch (cleanupErr) {
        console.error('[Business Signup] Failed to cleanup auth user after profile error:', cleanupErr);
      }
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('[Business Signup] User profile created, now creating business account');
    
    // Step 3: Create business account (requires user profile to exist due to FK)
    let businessAccount;
    try {
      businessAccount = await createBusinessAccount(data.user.id, {
        businessName,
        contactPersonName: name,
        contactEmail: email,
        businessAddress,
        businessPhone: businessPhone || phone || undefined,
        taxId: taxId || undefined,
        website: website || undefined,
        status: 'PENDING_VERIFICATION',
      });
    } catch (err) {
      console.error('[Business Signup] createBusinessAccount threw:', err);
      businessAccount = null;
    }

    if (!businessAccount) {
      console.error('[Business Signup] Failed to create business account for user', data.user.id);
      return NextResponse.json(
        { error: 'Failed to create business account. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('[Business Signup] Business account created successfully:', businessAccount.id);

    // Business status is tracked in business_accounts table, no need to update users.role

    return NextResponse.json({
      success: true,
      message: 'Business account created successfully',
      userId: data.user.id,
      businessAccountId: businessAccount.id,
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Business signup validation error:', error.flatten());
      return NextResponse.json(
        { error: 'Invalid signup data', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('Business signup unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create business account. Please contact support.' },
      { status: 500 }
    );
  }
}
