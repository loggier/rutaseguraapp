
'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const tokenSchema = z.object({
  userId: z.string().uuid(),
  token: z.string().min(1),
});

// Helper to create a Supabase admin client
const createSupabaseAdminClient = () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { get: () => undefined, set: () => {}, remove: () => {} },
            db: { schema: 'rutasegura' },
        }
    );
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = tokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
    }

    const { userId, token } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // Upsert para insertar el token si la combinación (user_id, token) no existe.
    // Si ya existe, simplemente actualiza el campo `updated_at`.
    // Esto permite que un usuario tenga múltiples tokens (en diferentes dispositivos),
    // pero evita que el mismo token se duplique para el mismo usuario.
    const { error } = await supabaseAdmin.from('fcm_tokens').upsert(
      {
        user_id: userId,
        token: token,
        updated_at: new Date().toISOString(),
      },
      { 
        onConflict: 'user_id, token', // El conflicto se basa en la combinación de user_id y token
        // ignoreDuplicates: false (default) hará que se actualice el 'updated_at' en un conflicto.
      }
    );

    if (error) {
      console.error('Error saving FCM token:', error);
      // Devolver el mensaje de error específico de la base de datos para depuración
      return NextResponse.json({ message: `Error al guardar el token en la base de datos: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Token guardado con éxito.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error inesperado en save-fcm-token:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
