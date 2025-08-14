
import { NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebaseAdmin';

const COOKIE_NAME = process.env.FIREBASE_COOKIE_NAME || 'session';

function cookiePolicy(url: URL) {
  const h = url.hostname;
  const isLocal =
    h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
  return {
    // For cross-site (Firebase Studio, custom domain, etc.) we must use None+Secure
    sameSite: (isLocal ? 'lax' : 'none') as 'lax' | 'none',
    secure: !isLocal,
  };
}

export async function POST(req: Request) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

  const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days
  const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

  const res = NextResponse.json({ ok: true });
  const { sameSite, secure } = cookiePolicy(new URL(req.url));

  res.cookies.set({
    name: COOKIE_NAME,
    value: sessionCookie,
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
    maxAge: Math.floor(expiresIn / 1000),
  });
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.json({ ok: true });
  const { sameSite, secure } = cookiePolicy(new URL(req.url));
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
    maxAge: 0,
  });
  return res;
}
