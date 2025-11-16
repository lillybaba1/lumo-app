import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateEmail } from '@/lib/email-validation';
import { validatePhoneNumber, normalizePhoneNumber } from '@/lib/phone-validation';
import { sendOTP, checkEmailExists, checkPhoneExists } from '@/lib/otp-service';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limiter';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  countryCode: string;
  acceptedTerms: boolean;
}

/**
 * POST /api/auth/signup
 * Step 1: Validate email, check duplicates, initiate signup
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);

    // Rate limiting for signup attempts
    const rateLimit = checkRateLimit(clientId, {
      limit: 5,
      window: 15 * 60 * 1000, // 15 minutes
    });

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: `Too many signup attempts. Please try again in ${rateLimit.resetTime} seconds.`,
          retryAfter: rateLimit.resetTime,
        },
        { status: 429, headers: rateLimit.headers }
      );
    }

    const body: SignupRequest = await request.json();
    const { email, password, name, phone, countryCode, acceptedTerms } = body;

    // Validation: Required fields
    if (!email || !password || !name || !phone || !countryCode) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Validation: Terms acceptance
    if (!acceptedTerms) {
      return NextResponse.json(
        { error: 'You must accept the Terms of Service and Privacy Policy to continue.' },
        { status: 400 }
      );
    }

    // Validation: Password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Strong password requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = await validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        {
          error: emailValidation.error,
          suggestions: emailValidation.suggestions,
        },
        { status: 400 }
      );
    }

    // Validate phone number
    const normalizedPhone = normalizePhoneNumber(phone, countryCode);
    const phoneValidation = validatePhoneNumber(normalizedPhone);

    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }

    // Check for existing email
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in or use a different email.' },
        { status: 409 }
      );
    }

    // Check for existing phone number
    const phoneExists = await checkPhoneExists(phoneValidation.normalized!);
    if (phoneExists) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists. Please use a different phone number.' },
        { status: 409 }
      );
    }

    // Create user with Supabase Auth
    const supabase = await createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      phone: phoneValidation.normalized,
      password,
      options: {
        data: {
          name: name.trim(),
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (signUpError) {
      console.error('Supabase signup error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message || 'Failed to create account. Please try again.' },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user account. Please try again.' },
        { status: 500 }
      );
    }

    // Create user profile in public.users table (use admin client to bypass RLS)
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: data.user.id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone_number: phoneValidation.normalized,
        role: 'customer',
        email_verified: false,
        phone_verified: false,
      });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);

      // If profile creation failed, delete the auth user to maintain consistency
      try {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      } catch (deleteError) {
        console.error('Failed to cleanup auth user:', deleteError);
      }

      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // Send email verification
    // (Supabase automatically sends this on signup)

    // Send SMS OTP for phone verification
    const otpResult = await sendOTP(phoneValidation.normalized!, 'signup', clientId);

    if (!otpResult.success) {
      // OTP failed but account was created - user can retry
      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully, but failed to send SMS verification. Please check your email to verify your account.',
          userId: data.user.id,
          requiresEmailVerification: true,
          requiresPhoneVerification: true,
          otpError: otpResult.error,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Please check your email and phone for verification.',
        userId: data.user.id,
        requiresEmailVerification: true,
        requiresPhoneVerification: true,
      },
      { status: 201, headers: rateLimit.headers }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
