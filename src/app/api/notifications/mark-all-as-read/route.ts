'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

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
    const { userId } = await request.json();
    if (!userId) {
        return NextResponse.json({ message: 'El ID de usuario es requerido.' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { error } = await supabaseAdmin
      .from('notificaciones')
      .update({ visto: true })
      .eq('user_id', userId)
      .eq('visto', false);

    if (error) {
      console.error('Error marcando notificaciones como leídas:', error);
      return NextResponse.json({ message: 'Error interno al actualizar notificaciones.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Todas las notificaciones han sido marcadas como leídas.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en POST /api/notifications/mark-all-as-read:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
