import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const error = searchParams.get('error');

  // If Supabase sends an error in the URL, redirect to auth error page
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=verification_failed&details=${encodeURIComponent(error)}`
    );
  }

  // If this route is hit without error, just send user to verified page as a fallback
  return NextResponse.redirect(`${origin}/auth/verified`);
}
