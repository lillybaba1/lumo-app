import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/admin');
  const isApiRoute = pathname.startsWith('/api/');

  // Allow /business/pending without any middleware processing to prevent loops
  if (pathname === '/business/pending') {
    return NextResponse.next();
  }

  try {
    // Always call updateSession - it has fallback credentials
    return await updateSession(request);
  } catch (error) {
    console.error('Middleware error:', error);
    // SECURITY: Fail closed for protected routes on error
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login?error=middleware', request.url));
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
