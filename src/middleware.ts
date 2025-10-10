'use server';

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('rutasegura_user');
  const { pathname } = request.nextUrl;

  // Si el usuario está logueado (tiene cookie) y está en la página de login, redirigir al dashboard.
  if (userCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si el usuario no está logueado (no tiene cookie) e intenta acceder a cualquier ruta del dashboard, redirigir al login.
  if (!userCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // En cualquier otro caso, permitir que la solicitud continúe.
  return NextResponse.next();
}

export const config = {
  /*
  * El matcher asegura que este middleware se ejecute en la página de login
  * y en todas las rutas bajo /dashboard.
  */
  matcher: ['/', '/dashboard/:path*'],
}
