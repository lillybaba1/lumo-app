
import { NextRequest, NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(req: NextRequest) {
  const isAuthed = !!req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  // If user is trying to access login or signup page while already logged in,
  // redirect them to the home page.
  if (isAuthed && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If user is not authenticated and trying to access a protected route (e.g., admin),
  // redirect them to the login page.
  if (!isAuthed && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*', '/login', '/signup'],
};
