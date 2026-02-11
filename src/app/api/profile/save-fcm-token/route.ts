
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

    // Upsert the token to avoid duplicates and handle updates
    const { error } = await supabaseAdmin.from('fcm_tokens').upsert(
      {
        user_id: userId,
        token: token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );

    if (error) {
      console.error('Error saving FCM token:', error);
      return NextResponse.json({ message: 'Error al guardar el token de notificación.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Token guardado con éxito.' }, { status: 200 });
  } catch (error) {
    console.error('Error inesperado en save-fcm-token:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
