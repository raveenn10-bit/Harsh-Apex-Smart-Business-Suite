import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/packages',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/leads',
  '/logo.png',
  '/brand',
  '/demo-assets',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check for session cookie
  const sessionCookie = request.cookies.get('harsh_apex_session');

  // If root path '/'
  if (pathname === '/') {
    if (sessionCookie?.value) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If requesting login page while already authenticated
  if (pathname === '/login' && sessionCookie?.value) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If unauthenticated on protected routes
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
