
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

    // Lógica manual y robusta para evitar problemas con `upsert` y `onConflict`.
    // 1. Verificar si la combinación exacta de usuario y token ya existe.
    const { data: existingToken, error: selectError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('token', token)
      .maybeSingle();

    if (selectError) {
      console.error('Error al verificar token existente:', selectError);
      return NextResponse.json({ message: `Error de base de datos al verificar token: ${selectError.message}` }, { status: 500 });
    }

    // 2. Si ya existe, no hacemos nada más que confirmar.
    if (existingToken) {
      return NextResponse.json({ message: 'Este dispositivo ya estaba registrado.' }, { status: 200 });
    }

    // 3. Si no existe, lo insertamos.
    const { error: insertError } = await supabaseAdmin
      .from('fcm_tokens')
      .insert({
        user_id: userId,
        token: token,
      });

    // Si hay un error de inserción (por ejemplo, violación de clave foránea porque el user_id no existe en rutasegura.users)
    // lo devolveremos de forma explícita.
    if (insertError) {
      console.error('Error al insertar el nuevo token FCM:', insertError);
      return NextResponse.json({ message: `Error de base de datos al guardar el token: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Token guardado con éxito.' }, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado en save-fcm-token:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
