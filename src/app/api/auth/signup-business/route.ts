import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBusinessAccount } from '@/services/businessAccountService';
import { z } from 'zod';

const websiteSchema = z
  .union([
    z.string().url({ message: 'Invalid url' }).trim(),
    z.literal('').transform(() => undefined),
  ])
  .optional()
  .nullable();

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

    // Step 1: Create auth user with Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          name,
          phone_number: phone,
        }
      }
    });

    if (signUpError) {
      const message = signUpError.message || 'Signup failed';
      console.error('Business signup: Supabase signup error:', signUpError);

      // Handle provider rate limiting gracefully
      if (message.toLowerCase().includes('for security purposes')) {
        return NextResponse.json(
          { error: 'rate_limit', message },
          { status: 429 }
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

    // Step 2: Create business account
    let businessAccount;
    try {
      businessAccount = await createBusinessAccount(data.user.id, {
        businessName,
        contactPersonName: name,
        contactEmail: email,
        businessAddress,
        businessPhone: businessPhone || phone,
        taxId: taxId || undefined,
        website: website || undefined,
        status: 'PENDING_VERIFICATION',
      });
    } catch (err) {
      console.error('Business signup: createBusinessAccount threw:', err);
      businessAccount = null;
    }

    if (!businessAccount) {
      console.error('Business signup: Failed to create business account for user', data.user.id);
      // User is created but business account failed
      // The user can still log in but won't have business access
      return NextResponse.json(
        { error: 'Failed to create business account. Please contact support.' },
        { status: 500 }
      );
    }

    // Step 3: Create user profile with business account reference
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: email,
        name: name,
        phone: phone,
        role: 'BUSINESS_ACCOUNT',
        business_account_id: businessAccount.id,
      });

    if (profileError) {
      console.error('Business signup: Failed to create user profile:', profileError);
      // Continue anyway - the business account is created
    }

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
