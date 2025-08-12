
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  
  // Clear the session cookie
  cookies().set("session", "", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax", 
      path: "/", 
      maxAge: 0 
  });

  return res;
}
