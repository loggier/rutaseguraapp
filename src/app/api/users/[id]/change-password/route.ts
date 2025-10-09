'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth-utils';

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  
  try {
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { newPassword } = validation.data;
    const hashedPassword = await hashPassword(newPassword);

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
    
    // Aquí, en lugar de usar supabase.auth.admin.updateUserById,
    // que es para la autenticación de Supabase, actualizamos nuestra tabla `users` personalizada.
    const { data, error } = await supabaseAdmin
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', userId);

    if (error) {
        console.error("Error al actualizar la contraseña en la BD:", error);
        return NextResponse.json({ message: 'Error interno al actualizar la contraseña: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Contraseña actualizada correctamente.' }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en la API de cambio de contraseña:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
