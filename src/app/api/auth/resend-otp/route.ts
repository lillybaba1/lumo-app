import { NextRequest, NextResponse } from 'next/server';
import { resendOTP } from '@/lib/otp-service';
import { getClientIdentifier } from '@/lib/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResendOTPRequest {
  phone: string;
}

/**
 * POST /api/auth/resend-otp
 * Resend SMS OTP code
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const body: ResendOTPRequest = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    const result = await resendOTP(phone, clientId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          retryAfter: result.retryAfter,
        },
        { status: result.retryAfter ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code has been resent to your phone.',
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
