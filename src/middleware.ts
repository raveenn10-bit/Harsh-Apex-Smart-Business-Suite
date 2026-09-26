import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

const PUBLIC_PATHS = [
  '/packages',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/leads',
  '/logo.png',
  '/brand',
  '/demo-assets',
  '/videos',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('harsh_apex_session');

  // 1. Allow static assets and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/videos') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Root path redirect
  if (pathname === '/') {
    if (sessionCookie?.value) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Login page handling (redirect if already logged in)
  if (pathname === '/login') {
    if (sessionCookie?.value) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 4. Other public paths
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // 5. Protected routes - require session cookie
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Refresh Supabase session cookies
  return createClient(request);
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
