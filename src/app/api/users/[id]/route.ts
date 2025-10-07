'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import type { Profile } from '@/lib/types';

const updateUserSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  apellido: z.string().min(1, "El apellido es requerido."),
  rol: z.enum(['master', 'manager', 'colegio', 'padre']),
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
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, apellido, rol } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Obtener el perfil actual para evitar cambios no deseados
    const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
        .from('profiles')
        .select('rol')
        .eq('id', userId)
        .single();
    
    if (currentProfileError || !currentProfile) {
         return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }
    
    if (currentProfile.rol === 'master' && rol !== 'master') {
        return NextResponse.json({ message: 'No se puede cambiar el rol de un usuario Master.' }, { status: 403 });
    }

    // 2. Actualizar el perfil
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ nombre, apellido, rol })
      .eq('id', userId)
      .select()
      .single();

    if (profileError || !updatedProfile) {
        console.error('Error al actualizar el perfil:', profileError);
        return NextResponse.json({ message: 'Error interno al actualizar el perfil.' }, { status: 500 });
    }
    
    // 3. Obtener datos de la tabla `users` para la respuesta completa
     const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('email, activo')
        .eq('id', userId)
        .single();
    
    if (userError || !user) {
         return NextResponse.json({ message: 'Error interno: no se pudo encontrar los detalles del usuario.' }, { status: 500 });
    }

    const responseData: Profile = { ...updatedProfile, email: user.email, activo: user.activo };
    return NextResponse.json({ message: 'Usuario actualizado con éxito', user: responseData }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en PUT /api/users/[id]:', error);
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

    // 1. Verificar que el usuario no sea 'master'
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    if (user.rol === 'master') {
      return NextResponse.json({ message: 'No se puede cambiar el estado de un usuario Master.' }, { status: 403 });
    }

    // 2. Actualizar el estado en la tabla `users`
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ activo })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error al actualizar el estado del usuario:", updateError);
      return NextResponse.json({ message: 'Error interno al cambiar el estado del usuario.' }, { status: 500 });
    }

    const message = `Usuario ${activo ? 'activado' : 'desactivado'} con éxito.`;
    return NextResponse.json({ message, newStatus: activo }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en PATCH /api/users/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}


// --- FUNCIÓN DELETE PARA ELIMINACIÓN PERMANENTE ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Verificar que el usuario no sea 'master'
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    if (profile.rol === 'master') {
      return NextResponse.json({ message: 'No se puede eliminar a un usuario Master.' }, { status: 403 });
    }

    // 2. Eliminar de `profiles`
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (deleteProfileError) {
      console.error('Error al eliminar el perfil:', deleteProfileError);
      return NextResponse.json({ message: 'Error interno al eliminar el perfil.' }, { status: 500 });
    }

    // 3. Eliminar de `users`
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteUserError) {
      // Nota: En un caso real, aquí se debería implementar un rollback o una estrategia para manejar la inconsistencia.
      console.error('Error al eliminar el usuario (el perfil fue eliminado):', deleteUserError);
      return NextResponse.json({ message: 'Error interno al eliminar el usuario.' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Usuario eliminado permanentemente con éxito.' }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en DELETE /api/users/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
