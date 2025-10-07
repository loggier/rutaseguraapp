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

// --- FUNCIÓN PUT PARA ACTUALIZAR ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  
  try {
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, apellido, rol } = validation.data;

    // Cliente con privilegios de servicio para poder actualizar perfiles
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

    // 1. Obtener el perfil actual para evitar cambios no deseados (ej. cambiar rol master)
    const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
        .from('profiles')
        .select('rol')
        .eq('id', userId)
        .single();
    
    if (currentProfileError || !currentProfile) {
         return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }
    
    // Regla de negocio: no se puede cambiar el rol de un 'master'
    if (currentProfile.rol === 'master' && rol !== 'master') {
        return NextResponse.json({ message: 'No se puede cambiar el rol de un usuario Master.' }, { status: 403 });
    }


    // 2. Actualizar el perfil en la tabla `profiles`
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nombre: nombre,
        apellido: apellido,
        rol: rol,
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError || !updatedProfile) {
        console.error('Error al actualizar el perfil:', profileError);
        return NextResponse.json({ message: 'Error interno al actualizar el perfil de usuario.' }, { status: 500 });
    }
    
    // 3. Obtener el email y estado de la tabla `users` para devolver el objeto completo
     const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('email, activo')
        .eq('id', userId)
        .single();
    
    if (userError || !user) {
         return NextResponse.json({ message: 'Error interno: no se pudo encontrar el email del usuario.' }, { status: 500 });
    }

    const responseData: Profile = { ...updatedProfile, email: user.email, activo: user.activo };

    return NextResponse.json({ message: 'Usuario actualizado con éxito', user: responseData }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en la API de actualización de usuarios:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}


// --- FUNCIÓN DELETE PARA DESACTIVAR/ACTIVAR ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;

  try {
     // Cliente con privilegios de servicio para poder actualizar usuarios
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

    // 1. Obtener el estado actual del usuario
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('activo, rol:profiles(rol)')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    const userRole = Array.isArray(user.rol) ? user.rol[0]?.rol : user.rol?.rol;
    if (userRole === 'master') {
      return NextResponse.json({ message: 'No se puede cambiar el estado de un usuario Master.' }, { status: 403 });
    }

    // 2. Cambiar el estado (si está activo se desactiva y viceversa)
    const newStatus = !user.activo;
    
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ activo: newStatus })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error al actualizar el estado del usuario:", updateError);
      return NextResponse.json({ message: 'Error interno al cambiar el estado del usuario.' }, { status: 500 });
    }

    const message = `Usuario ${newStatus ? 'activado' : 'desactivado'} con éxito.`;
    return NextResponse.json({ message, newStatus }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en la API de cambio de estado de usuario:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
