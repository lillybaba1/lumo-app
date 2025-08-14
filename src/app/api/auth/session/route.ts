
import { NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebaseAdmin';

const COOKIE_NAME = process.env.FIREBASE_COOKIE_NAME || 'session';

export async function POST(req: Request) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

  const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days
  const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: sessionCookie,
    httpOnly: true,
    secure: true, 
    sameSite: 'none',
    path: '/',
    maxAge: Math.floor(expiresIn / 1000),
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: process.env.FIREBASE_COOKIE_NAME || 'session',
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  });
  return res;
}
