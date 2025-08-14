
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./src/hooks/use-auth";

export const runtime = "nodejs";

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  const user = await getCurrentUser();
  const { pathname } = req.nextUrl;

  // If user is logged in
  if (user) {
    // and tries to access login or signup, redirect to home
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    // and is not an admin but tries to access admin routes, redirect to home
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  // If user is not logged in and tries to access admin routes, redirect to login
  else if (pathname.startsWith('/admin')) {
     return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*', '/login', '/signup'],
};
