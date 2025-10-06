
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // updateSession refresca la sesión del usuario y la devuelve
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Si el usuario no está logueado y пытается acceder a una ruta protegida
  if (!user && pathname.startsWith('/dashboard')) {
    // Redirige a la página de login
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // Si el usuario está logueado y está en la página de login, redirige al dashboard
  if (user && pathname === '/') {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  // Si no se cumple ninguna de las condiciones anteriores, permite la solicitud
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
