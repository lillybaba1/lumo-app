import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { recordUserLogin } from '@/services/ipService';

/**
 * Get the real client IP address from various headers
 * Priority: Vercel > Cloudflare > Standard forwarded headers
 */
function getClientIP(headersList: Headers): string {
  // Vercel-specific headers (most reliable on Vercel)
  const vercelForwardedFor = headersList.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Vercel also sets x-real-ip
  const vercelRealIP = headersList.get('x-real-ip');
  if (vercelRealIP) {
    return vercelRealIP;
  }

  // Cloudflare header (if using Cloudflare in front of Vercel)
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // True-Client-IP (Cloudflare Enterprise or Akamai)
  const trueClientIP = headersList.get('true-client-ip');
  if (trueClientIP) {
    return trueClientIP;
  }

  // Standard X-Forwarded-For header
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback
  return '0.0.0.0';
}

/**
 * POST /api/auth/record-login
 * Records a user login for IP tracking purposes
 * Called after successful authentication
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get IP address from headers
    const headersList = await headers();
    const ipAddress = getClientIP(headersList);

    // Get user agent
    const userAgent = headersList.get('user-agent') || undefined;

    // Get Vercel geolocation headers (free on Vercel!)
    const vercelCountry = headersList.get('x-vercel-ip-country') || undefined;
    const vercelCity = headersList.get('x-vercel-ip-city') || undefined;
    // Decode city name (Vercel URL-encodes it)
    const decodedCity = vercelCity ? decodeURIComponent(vercelCity) : undefined;

    // Parse request body for additional info
    let loginType: 'password' | 'magic_link' | 'oauth' | 'phone' | '2fa' = 'password';
    let deviceFingerprint: string | undefined;
    let sessionId: string | undefined;

    try {
      const body = await request.json();
      if (body.loginType) loginType = body.loginType;
      if (body.deviceFingerprint) deviceFingerprint = body.deviceFingerprint;
      if (body.sessionId) sessionId = body.sessionId;
    } catch {
      // Body parsing is optional
    }

    // Record the login with Vercel geolocation data
    await recordUserLogin(user.id, user.email, ipAddress, {
      userAgent,
      deviceFingerprint,
      loginType,
      sessionId,
      country: vercelCountry,
      city: decodedCity,
    });

    return NextResponse.json({ success: true, ip: ipAddress });
  } catch (error) {
    console.error('Record login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
