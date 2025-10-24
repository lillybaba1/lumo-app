import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const COOKIE_NAME = process.env.FIREBASE_COOKIE_NAME ?? 'session';

function cookiePolicyFromHost(hostname: string | null) {
  const h = hostname || 'localhost';
  const isLocal = h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
  return {
    sameSite: (isLocal ? 'lax' : 'none') as 'lax' | 'none',
    secure: !isLocal,
  };
}

function hostnameFromRequest(req: Request) {
  try {
    // In most runtimes req.url is absolute, but fall back to host header if not.
    return new URL(req.url).hostname;
  } catch (_) {
    return req.headers.get('host');
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const idToken = body?.idToken;
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

    // expiresIn is in milliseconds. Use 5 days.
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days

    const admin = authAdmin();
    const sessionCookie = await admin.createSessionCookie(idToken, { expiresIn });

    const hostname = hostnameFromRequest(req);
    const { sameSite, secure } = cookiePolicyFromHost(hostname);

    // Use next/headers cookies() to set a secure httpOnly cookie
    (await cookies()).set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: expiresIn / 1000,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to create session cookie:', err?.message || err, err?.stack ? err.stack : 'no-stack');
    // Return error code (if present) to help debugging without leaking secrets
    const safeDetails = { message: err?.message || 'Failed to create session cookie', code: err?.code || null };
    return NextResponse.json({ error: safeDetails.message, details: safeDetails.code }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const hostname = hostnameFromRequest(req);
  const { sameSite, secure } = cookiePolicyFromHost(hostname);
  (await cookies()).set(COOKIE_NAME, '', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
