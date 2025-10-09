import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('rutasegura_user');
  const { pathname } = request.nextUrl;

  // Si el usuario no está autenticado (no hay cookie) y intenta acceder a cualquier ruta del dashboard,
  // redirígelo a la página de login.
  if (!userCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si el usuario está autenticado (hay cookie) y está en la página de login,
  // redirígelo al dashboard.
  if (userCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si no se cumple ninguna de las condiciones anteriores, permite que la solicitud continúe.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     * - logo files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
