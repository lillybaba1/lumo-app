import { NextRequest, NextResponse } from 'next/server';
import { checkPhoneExists } from '@/lib/otp-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-phone?phone=+2201234567
 * Check if a phone number is already registered
 */
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }

  try {
    const exists = await checkPhoneExists(phone);
    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
