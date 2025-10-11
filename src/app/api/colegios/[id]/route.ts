'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const updateSchoolSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  ruc: z.string().length(13, 'El RUC debe tener 13 caracteres'),
  email_contacto: z.string().email('Email de contacto inválido'),
  telefono: z.string().min(1, 'Teléfono requerido'),
  direccion: z.string().min(1, 'Dirección requerida'),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  calle: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
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

// --- PUT para actualizar info del colegio ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const schoolId = params.id;
  
  try {
    const body = await request.json();
    const validation = updateSchoolSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, ruc, email_contacto, telefono, direccion, lat, lng, calle, numero } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Actualizar la tabla `colegios`
    const { error: updateError } = await supabaseAdmin
      .from('colegios')
      .update({ nombre, ruc, email_contacto, telefono, direccion, lat, lng, calle, numero })
      .eq('id', schoolId);
      
    if (updateError) {
        console.error('Error al actualizar el colegio:', updateError);
        return NextResponse.json({ message: 'Error interno al actualizar los datos del colegio: ' + updateError?.message }, { status: 500 });
    }

    // 2. Obtener los datos actualizados desde la VISTA para evitar joins ambiguos
    const { data: updatedSchool, error: schoolError } = await supabaseAdmin
        .from('colegios_view')
        .select('*')
        .eq('id', schoolId)
        .single();
    
    if (schoolError || !updatedSchool) {
        console.error('Error al obtener el colegio actualizado desde la vista:', schoolError);
        return NextResponse.json({ message: 'Error al recuperar los datos actualizados.' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Colegio actualizado con éxito', colegio: updatedSchool }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en PUT /api/colegios/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}

// --- PATCH para cambiar estado (activo/inactivo) ---
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const schoolId = params.id;
  try {
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if(!validation.success) {
      return NextResponse.json({ message: "Datos inválidos (se esperaba 'activo').", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { activo } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Obtener el `usuario_id` del colegio
    const { data: school, error: schoolError } = await supabaseAdmin
        .from('colegios')
        .select('usuario_id')
        .eq('id', schoolId)
        .single();
    
    if (schoolError || !school) {
        return NextResponse.json({ message: 'Colegio no encontrado.' }, { status: 404 });
    }

    // --- Transacción ---
    // 2. Actualizar el estado en la tabla `colegios`
    const { error: updateSchoolError } = await supabaseAdmin
      .from('colegios')
      .update({ activo })
      .eq('id', schoolId);
      
    if (updateSchoolError) {
      console.error("Error al actualizar el estado del colegio:", updateSchoolError);
      return NextResponse.json({ message: 'Error interno al cambiar el estado del colegio.' }, { status: 500 });
    }

    // 3. Actualizar el estado en la tabla `users` asociada
     const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({ activo })
      .eq('id', school.usuario_id);
    
     if (updateUserError) {
      // Rollback manual si falla la segunda actualización
      await supabaseAdmin.from('colegios').update({ activo: !activo }).eq('id', schoolId);
      console.error("Error al actualizar el estado del usuario asociado:", updateUserError);
      return NextResponse.json({ message: 'Error al cambiar estado de la cuenta de usuario.' }, { status: 500 });
    }
    // --- Fin Transacción ---

    const message = `Colegio y su cuenta han sido ${activo ? 'activados' : 'desactivados'} con éxito.`;
    return NextResponse.json({ message, newStatus: activo }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en PATCH /api/colegios/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}


// --- DELETE para eliminación permanente ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const schoolId = params.id;

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Obtener el `usuario_id` del colegio que se va a eliminar.
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('colegios')
      .select('usuario_id')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      return NextResponse.json({ message: 'Colegio no encontrado para eliminar.' }, { status: 404 });
    }
    const userIdToDelete = school.usuario_id;
    
    // --- Transacción de eliminación ---
    // 2. Eliminar de `colegios`
    const { error: deleteSchoolError } = await supabaseAdmin
      .from('colegios')
      .delete()
      .eq('id', schoolId);

    if (deleteSchoolError) {
        console.error('Error al eliminar el colegio:', deleteSchoolError);
        return NextResponse.json({ message: 'Error interno al eliminar el colegio: ' + deleteSchoolError.message }, { status: 500 });
    }
    
    // 3. Eliminar de `profiles`
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete);
    
    // Si el perfil no existía, no es un error fatal, pero se loguea.
    if (deleteProfileError) {
      console.warn('Advertencia al eliminar perfil (puede que no existiera):', deleteProfileError);
    }

    // 4. Eliminar de `users` (la cuenta de autenticación)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);


    if (deleteUserError) {
      // Este es un problema más serio porque deja un registro huérfano.
      console.error('Error Crítico: El colegio y perfil fueron eliminados, pero el usuario no:', deleteUserError);
      return NextResponse.json({ message: 'Error interno al eliminar la cuenta de usuario. Contacte a soporte.' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Colegio eliminado permanentemente con éxito.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en DELETE /api/colegios/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
