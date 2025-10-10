'use server';

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('rutasegura_user');
  const { pathname } = request.nextUrl;

  // If the user has a cookie and is on the login page, redirect to the dashboard.
  if (userCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user does not have a cookie and is trying to access a dashboard page,
  // redirect them to the login page.
  if (!userCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Otherwise, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  /*
  * The matcher ensures this middleware runs on the login page
  * and all routes under /dashboard.
  */
  matcher: ['/', '/dashboard/:path*'],
}
