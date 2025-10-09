'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import type { Profile } from '@/lib/types';
import { hashPassword } from '@/lib/auth-utils';

const updateParentSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  apellido: z.string().min(1, "El apellido es requerido."),
  colegio_id: z.string().uuid("ID de colegio inválido.").optional().nullable(),
});

const updateStatusSchema = z.object({
    activo: z.boolean(),
});

// --- Cliente Supabase Admin ---
const createSupabaseAdminClient = () => {
    return createServerClient(
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
}

// --- FUNCIÓN PUT PARA ACTUALIZAR INFO DEL PERFIL ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  
  try {
    const body = await request.json();
    const validation = updateParentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, apellido, colegio_id } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Actualizar el perfil
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ nombre, apellido, colegio_id })
      .eq('id', userId)
      .eq('rol', 'padre')
      .select()
      .single();

    if (profileError || !updatedProfile) {
        console.error('Error al actualizar el perfil del padre/tutor:', profileError);
        return NextResponse.json({ message: 'Error interno al actualizar el perfil.' }, { status: 500 });
    }
    
    // 2. Obtener datos de la tabla `users` para la respuesta completa
     const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('email, activo')
        .eq('id', userId)
        .single();
    
    if (userError || !user) {
         return NextResponse.json({ message: 'Error interno: no se pudo encontrar los detalles de la cuenta.' }, { status: 500 });
    }

    const responseData: Profile = { ...updatedProfile, email: user.email, activo: user.activo };
    return NextResponse.json({ message: 'Padre/Tutor actualizado con éxito', user: responseData }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en PUT /api/parents/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}

// --- FUNCIÓN PATCH PARA CAMBIAR ESTADO (ACTIVO/INACTIVO) ---
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  try {
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if(!validation.success) {
      return NextResponse.json({ message: "Datos inválidos (se esperaba 'activo').", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { activo } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Actualizar el estado en la tabla `users`
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ activo })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error al actualizar el estado del padre/tutor:", updateError);
      return NextResponse.json({ message: 'Error interno al cambiar el estado del usuario.' }, { status: 500 });
    }

    const message = `Padre/Tutor ${activo ? 'activado' : 'desactivado'} con éxito.`;
    return NextResponse.json({ message, newStatus: activo }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en PATCH /api/parents/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}


// --- FUNCIÓN DELETE PARA ELIMINACIÓN PERMANENTE ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    
    // --- Transacción de eliminación ---
    // 1. Eliminar de `profiles`
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)
      .eq('rol', 'padre');
    
    if (deleteProfileError) {
      console.error('Error al eliminar el perfil:', deleteProfileError);
      return NextResponse.json({ message: 'Error interno al eliminar el perfil.' }, { status: 500 });
    }

    // 2. Eliminar de la tabla `users` local
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteUserError) {
      console.error('Error al eliminar el usuario de la tabla `users`:', deleteUserError);
      return NextResponse.json({ message: 'Error interno al eliminar la entrada del usuario.' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Padre/Tutor eliminado permanentemente con éxito.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en DELETE /api/parents/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
