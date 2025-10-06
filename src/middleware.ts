import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // updateSession se encarga de refrescar la sesión del usuario y devuelve
  // la respuesta actualizada y el usuario.
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // Si no hay usuario y están intentando acceder a cualquier ruta del dashboard,
  // redirigir a la página de login.
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si hay un usuario y está en la página de login, redirigir al dashboard.
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Si no se cumple ninguna de las condiciones anteriores, continuar con la respuesta
  // que ya tiene las cookies de sesión actualizadas.
  return response
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
