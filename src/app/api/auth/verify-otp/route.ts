import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp-service';
import { getClientIdentifier } from '@/lib/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VerifyOTPRequest {
  phone: string;
  code: string;
}

/**
 * POST /api/auth/verify-otp
 * Verify SMS OTP code
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

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully!',
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
