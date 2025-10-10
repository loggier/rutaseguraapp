'use server';

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('rutasegura_user');
  const { pathname } = request.nextUrl;

  // Si el usuario tiene una cookie y está en la página de login, redirigir al dashboard.
  if (userCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si el usuario no tiene una cookie e intenta acceder a una página del dashboard,
  // redirigirlo a la página de login.
  if (!userCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si no, permitir que la solicitud continúe.
  return NextResponse.next();
}

export const config = {
  /*
  * El 'matcher' asegura que este middleware se ejecute solo en la página de login ('/')
  * y en todas las rutas que comiencen con '/dashboard'.
  */
  matcher: ['/', '/dashboard/:path*'],
};
