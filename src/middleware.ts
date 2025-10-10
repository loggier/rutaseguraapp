'use server';

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('rutasegura_user');
  const { pathname } = request.nextUrl;

  // Si el usuario tiene una cookie de sesión y está en la página de login ('/'),
  // lo redirigimos al dashboard.
  if (userCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si el usuario NO tiene una cookie de sesión e intenta acceder a cualquier
  // página dentro del dashboard, lo redirigimos a la página de login.
  if (!userCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si ninguna de las condiciones anteriores se cumple, permitimos que la solicitud continúe.
  return NextResponse.next();
}

export const config = {
  /*
  * El 'matcher' asegura que este middleware se ejecute solo en la página de login ('/')
  * y en todas las rutas que comiencen con '/dashboard'.
  */
  matcher: ['/', '/dashboard/:path*'],
};
