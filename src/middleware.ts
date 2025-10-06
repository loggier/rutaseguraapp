import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const { data: { session }} = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Si el usuario no tiene sesión y intenta acceder al dashboard, redirigir a login.
  if (!session && pathname.startsWith('/dashboard')) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // Si el usuario tiene sesión y está en la página de login, redirigir al dashboard.
  if (session && pathname === '/') {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }
  
  return await updateSession(request);
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
};
