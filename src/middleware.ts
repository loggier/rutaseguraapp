'use server';

import { NextResponse, type NextRequest } from 'next/server';

// El middleware se desactiva para manejar la lógica de sesión en el lado del cliente.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [], // No ejecutar en ninguna ruta
};
