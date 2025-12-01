import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/admin');
  const isApiRoute = pathname.startsWith('/api/');

  try {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not configured');
      // SECURITY: Fail closed for protected routes when env vars missing
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/login?error=config', request.url));
      }
      return NextResponse.next();
    }

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
