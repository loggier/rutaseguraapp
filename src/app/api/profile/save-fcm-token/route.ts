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
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { userId, token } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // Usamos `upsert` con `ignoreDuplicates: true`.
    // Esto es atómico y le dice a la base de datos: "Intenta insertar esta fila.
    // Si ya existe una fila que causa un conflicto en las columnas 'user_id' y 'token',
    // simplemente no hagas nada y no generes un error".
    // Esta es la forma más robusta de evitar duplicados y errores de "duplicate key".
    const { error: upsertError } = await supabaseAdmin
      .from('fcm_tokens')
      .upsert(
        { user_id: userId, token: token },
        { onConflict: 'user_id,token', ignoreDuplicates: true }
      );
    
    if (upsertError) {
      console.error('Error al hacer upsert del token FCM:', upsertError);
      return NextResponse.json({ message: `Error de base de datos al guardar el token: ${upsertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Token guardado con éxito.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en save-fcm-token:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
