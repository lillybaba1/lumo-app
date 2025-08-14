
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const COOKIE_NAME = process.env.FIREBASE_COOKIE_NAME || 'session';

const PUBLIC_PATHS = [
  '/', '/login', '/signup', '/favicon.ico', '/icon.svg',
  '/_next', '/images', '/api/session' // allow login API
];

function isPublic(path: string) {
  // Allow product detail pages and static pages to be public
  if (path.startsWith('/products/') || path.startsWith('/pages/')) {
    return true;
  }
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
}
function needsAuth(path: string) {
  return path.startsWith('/admin') || path.startsWith('/account');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(COOKIE_NAME);

  if ((pathname === '/login' || pathname === '/signup') && hasSession) {
    const url = req.nextUrl.clone(); url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (needsAuth(pathname) && !hasSession && !isPublic(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api/health|_next/static|favicon.ico).*)'] };
