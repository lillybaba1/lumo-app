import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Middleware runs on Edge Runtime by default for minimal TTFB
// Keep this file Edge-compatible (no Node.js APIs like fs, path, etc.)

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Fast path: Skip middleware for static routes that don't need auth
  // This reduces Edge function invocations and improves TTFB
  if (
    pathname === '/business/pending' ||
    pathname === '/icon.svg' ||
    pathname.startsWith('/api/public/')
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute = pathname.startsWith('/admin');
  const isApiRoute = pathname.startsWith('/api/');
  const isBusinessRoute = pathname.startsWith('/business');

  try {
    // Supabase session management - runs on Edge
    return await updateSession(request);
  } catch (error) {
    // SECURITY: Fail closed for protected routes on error
    if (isProtectedRoute || isBusinessRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'session');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // For API routes, return 500 on middleware error
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    // Allow public routes to continue
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
