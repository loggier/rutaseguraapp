'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const updateSchema = z.object({
  visto: z.boolean(),
});

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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const notificationId = params.id;

  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Datos inválidos.' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('notificaciones')
      .update({ visto: validation.data.visto })
      .eq('id', notificationId);

    if (error) {
      console.error('Error actualizando notificación:', error);
      return NextResponse.json({ message: 'Error interno al actualizar la notificación.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notificación actualizada.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error inesperado en PATCH /api/notifications/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
