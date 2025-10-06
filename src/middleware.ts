
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // This will refresh the session cookie
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // If the user is not logged in and tries to access the dashboard, redirect to login
  if (!user && pathname.startsWith('/dashboard')) {
    return Response.redirect(new URL('/', request.url))
  }

  // If the user is logged in and is on the login page, redirect to dashboard
  if (user && pathname === '/') {
    return Response.redirect(new URL('/dashboard', request.url))
  }

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
