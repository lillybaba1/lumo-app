export const runtime = 'edge';

import { NextResponse } from 'next/server';

const COOKIE_NAME = process.env.FIREBASE_COOKIE_NAME ?? 'session';

function cookiePolicy(url: URL) {
  const h = url.hostname;
  const isLocal = h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
  return {
    // For cross-site (Firebase Console, custom domain, etc.) use None+Secure
    sameSite: (isLocal ? 'lax' : 'none') as 'lax' | 'none',
    secure: !isLocal,
  };
}

export async function POST() {
  // Edge runtime can't use firebase-admin to mint session cookies.
  // Expose 501 so callers know this endpoint isn't available on Edge.
  return NextResponse.json(
    { error: 'Creating Firebase session cookies is not supported on the Edge runtime.' },
    { status: 501 }
  );
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
