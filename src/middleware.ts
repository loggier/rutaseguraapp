'use server';

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('rutasegura_user');
  const { pathname } = request.nextUrl;

  // Si no hay cookie y el usuario intenta acceder al dashboard, redirigir al login
  if (!userCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si hay cookie y el usuario está en la página de login, redirigir al dashboard
  if (userCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
  * El matcher asegura que este middleware se ejecute en la página de login
  * y en todas las rutas bajo /dashboard.
  */
  matcher: ['/', '/dashboard/:path*'],
}
