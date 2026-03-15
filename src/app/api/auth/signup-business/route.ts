import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBusinessAccount } from '@/services/businessAccountService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkPhoneExists } from '@/lib/otp-service';
import { z } from 'zod';

const websiteSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? undefined : val))
  .pipe(z.string().url({ message: 'Invalid url' }).optional().nullable());

const signupSchema = z.object({
  signupMethod: z.enum(['email', 'phone']).default('email'),
  email: z.string().email().optional().nullable(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  businessName: z.string().min(1),
  businessAddress: z.string().min(1),
  businessPhone: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  website: websiteSchema,
}).refine(
  (data) => {
    if (data.signupMethod === 'email') return !!data.email;
    if (data.signupMethod === 'phone') return !!data.phone;
    return true;
  },
  { message: 'Email is required for email signup, phone is required for phone signup' }
);

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
      signupMethod,
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

    // Check if phone number already has an account
    if (signupMethod === 'phone' && phone) {
      const phoneExists = await checkPhoneExists(phone);
      if (phoneExists) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists. Please sign in instead, or use a different number.' },
          { status: 409 }
        );
      }
    }

    // Step 0: Check if business name is already taken (case-insensitive)
    const { data: existingBusiness, error: checkError } = await supabaseAdmin
      .from('business_accounts')
      .select('id')
      .ilike('business_name', businessName.trim())
      .maybeSingle();

    if (checkError) {
      console.error('[Business Signup] Error checking business name:', checkError);
      return NextResponse.json(
        { error: 'Failed to validate business name. Please try again.' },
        { status: 500 }
      );
    }

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'Business name already taken', details: { fieldErrors: { businessName: ['A business with this name already exists. Please choose a different name.'] } } },
        { status: 409 }
      );
    }

    // Get the site URL for redirects
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Step 1: Create auth user using signUp
    console.log('[Business Signup] Creating auth user via', signupMethod, ':', signupMethod === 'phone' ? phone : email);
    
    let authData;
    let signUpError;

    if (signupMethod === 'phone' && phone) {
      // Phone-based signup (sends OTP automatically)
      const result = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            name,
            phone_number: phone,
            role: 'BUSINESS_ACCOUNT',
          },
        }
      });
      authData = result.data;
      signUpError = result.error;
    } else {
      // Email-based signup (sends verification email automatically)
      console.log('[Business Signup] Using redirect URL:', `${siteUrl}/auth/callback`);
      const result = await supabase.auth.signUp({
        email: email!.toLowerCase().trim(),
        password,
        options: {
          data: {
            name,
            phone_number: phone,
            role: 'BUSINESS_ACCOUNT',
          },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        }
      });
      authData = result.data;
      signUpError = result.error;
    }

    if (signUpError) {
      const message = signUpError.message || 'Signup failed';
      const errorCode = (signUpError as any).code || (signUpError as any).error_code || '';
      console.error('[Business Signup] signUp error:', signUpError);

      if (message.includes('already been registered') || message.includes('User already exists') || message.includes('already exists') || message.includes('already in use')) {
         return NextResponse.json(
          { error: signupMethod === 'phone' ? 'Phone number already in use' : 'Email already in use', details: { fieldErrors: signupMethod === 'phone' ? { phone: ['Phone number already in use'] } : { email: ['Email already in use'] } } },
          { status: 409 }
        );
      }

      if (errorCode === 'email_address_invalid' || message.toLowerCase().includes('email') && message.toLowerCase().includes('invalid')) {
        return NextResponse.json(
          { error: 'We couldn\'t verify this email address. Please double-check for typos, or try a different email address.', error_code: 'email_address_invalid' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    console.log('[Business Signup] Auth user created:', userId);

    // Step 2: Create user profile in users table using admin client (bypasses RLS)
    // The regular signUp already created the user in auth.users, so FK is satisfied
    console.log('[Business Signup] Creating user profile for:', userId);
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: email ? email.toLowerCase().trim() : null,
        name: name.trim(),
        phone_number: phone || null,
        role: 'BUSINESS_ACCOUNT',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('[Business Signup] Failed to create user profile:', JSON.stringify(profileError, null, 2));
      // Clean up auth user so we don't leave dangling accounts
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
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
      businessAccount = await createBusinessAccount(userId, {
        businessName,
        contactPersonName: name,
        contactEmail: email || undefined,
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
      console.error('[Business Signup] Failed to create business account for user', userId);
      return NextResponse.json(
        { error: 'Failed to create business account. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('[Business Signup] Business account created successfully:', businessAccount.id);

    // Note: Verification was sent automatically by signUp (email link or SMS OTP)
    console.log('[Business Signup] Verification sent via', signupMethod);

    return NextResponse.json({
      success: true,
      signupMethod,
      message: signupMethod === 'phone'
        ? 'Business account created. Please verify your phone with the OTP code sent.'
        : 'Business account created successfully. Please check your email to verify your account.',
      userId: userId,
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
