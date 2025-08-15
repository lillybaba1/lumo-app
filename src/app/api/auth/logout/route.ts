
export const runtime = 'edge';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.FIREBASE_COOKIE_NAME || 'session';

function cookiePolicy(url: URL) {
  const h = url.hostname;
  const isLocal =
    h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
  return {
    sameSite: (isLocal ? 'lax' : 'none') as 'lax' | 'none',
    secure: !isLocal,
  };
}


export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  const { sameSite, secure } = cookiePolicy(new URL(req.url));
  
  // Clear the session cookie
  (await
    // Clear the session cookie
    cookies()).set(COOKIE_NAME, "", { 
      httpOnly: true, 
      secure,
      sameSite,
      path: "/", 
      maxAge: 0 
  });

  return res;
}
