import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp-service';
import { getClientIdentifier } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VerifyOTPRequest {
  phone: string;
  code: string;
}

/**
 * POST /api/auth/verify-otp
 * Verify SMS OTP code and create authenticated session
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const body: VerifyOTPRequest = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required.' },
        { status: 400 }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Verification code must be 6 digits.' },
        { status: 400 }
      );
    }

    // First verify the OTP code
    const result = await verifyOTP(phone, code, clientId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          remainingAttempts: result.remainingAttempts,
          retryAfter: result.retryAfter,
        },
        { status: 400 }
      );
    }

    // Now create a Supabase session by verifying OTP with Supabase Auth
    const supabase = await createClient();

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (verifyError) {
      console.error('Supabase OTP verification error:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify OTP and create session.' },
        { status: 400 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Failed to create authenticated session.' },
        { status: 400 }
      );
    }

    // Update user verification status
    const { error: updateError } = await supabase
      .from('users')
      .update({ phone_verified: true })
      .eq('phone_number', phone);

    if (updateError) {
      console.error('Failed to update phone verification status:', updateError);
      // Continue anyway - user is authenticated
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully! You are now logged in.',
      user: data.user,
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
