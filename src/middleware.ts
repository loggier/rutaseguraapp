'use server';

import { NextResponse, type NextRequest } from 'next/server'

// This middleware is currently not in use but can be adapted for session management.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  /*
  * Match all request paths except for the ones starting with:
  * - api (API routes)
  * - _next/static (static files)
  * - _next/image (image optimization files)
  * - favicon.ico (favicon file)
  * - image assets (logo, etc.)
  */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
