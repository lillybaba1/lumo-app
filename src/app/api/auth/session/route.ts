
import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Optional: verify token to enforce only your project
    await authAdmin.verifyIdToken(idToken);

    const expiresIn = 1000 * 60 * 60 * 24 * 5; // 5 days
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    
    // Revalidate the layout to ensure the new user state is picked up
    revalidatePath('/', 'layout');

    return res;
  } catch (e: any) {
    console.error("Session route error:", e);
    return NextResponse.json({ error: e?.message ?? "session failed" }, { status: 500 });
  }
}
