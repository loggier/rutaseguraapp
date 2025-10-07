'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ message: 'El ID de usuario y la nueva contraseña son requeridos.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    // Se crea un cliente de Supabase con rol de servicio para esta operación.
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
            get: () => undefined,
            set: () => {},
            remove: () => {},
        },
        db: {
          schema: 'rutasegura',
        },
      }
    );

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (updateError) {
      console.error('Error al actualizar la contraseña:', updateError);
      return NextResponse.json({ message: 'Error interno al actualizar la contraseña.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Contraseña actualizada correctamente.' }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en la API de actualización de contraseña:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
