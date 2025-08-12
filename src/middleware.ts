
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/hooks/use-auth";

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
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

  // This part requires an async check for user role
  if (isAuthed && pathname.startsWith('/admin')) {
    try {
      const user = await getCurrentUser();
      if (user?.role !== 'admin') {
        // If the user is authenticated but not an admin, redirect to home
        return NextResponse.redirect(new URL('/', req.url));
      }
    } catch(e) {
      // If there's an error verifying the session, treat as unauthenticated
       return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*', '/login', '/signup'],
};
