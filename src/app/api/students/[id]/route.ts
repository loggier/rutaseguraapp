'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const updateStudentSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  apellido: z.string().min(1, "El apellido es requerido."),
  email: z.string().email("El email no es válido.").optional().nullable().or(z.literal('')),
  telefono: z.string().optional().nullable(),
  padre_id: z.string().uuid("ID de padre/tutor inválido."),
  avatar_url: z.string().url().optional().nullable(),
});

const updateStatusSchema = z.object({
    activo: z.boolean(),
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

// --- PUT to update student info ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const studentId = params.id;
  
  try {
    const body = await request.json();
    const validation = updateStudentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, apellido, email, telefono, padre_id, avatar_url } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // Update the student record
    const { data: updatedStudent, error: updateError } = await supabaseAdmin
      .from('estudiantes')
      .update({ nombre, apellido, email, telefono, padre_id, avatar_url })
      .eq('id', studentId)
      .select(`
        *,
        padre:profiles(nombre, apellido, email),
        colegio:colegios(nombre)
      `)
      .single();
      
    if (updateError) {
        console.error('Error al actualizar el estudiante:', updateError);
        return NextResponse.json({ message: 'Error interno al actualizar el estudiante: ' + updateError?.message }, { status: 500 });
    }
    
    const responseData = {
        ...updatedStudent,
        padre_nombre: updatedStudent.padre ? `${updatedStudent.padre.nombre} ${updatedStudent.padre.apellido}` : 'No asignado',
        padre_email: updatedStudent.padre ? updatedStudent.padre.email : '-',
        colegio_nombre: updatedStudent.colegio ? updatedStudent.colegio.nombre : 'No asignado'
    };

    return NextResponse.json({ message: 'Estudiante actualizado con éxito', student: responseData }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en PUT /api/students/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}

// --- PATCH para cambiar estado (activo/inactivo) ---
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const studentId = params.id;
  try {
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if(!validation.success) {
      return NextResponse.json({ message: "Datos inválidos (se esperaba 'activo').", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { activo } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    const { error: updateError } = await supabaseAdmin
      .from('estudiantes')
      .update({ activo })
      .eq('id', studentId);
      
    if (updateError) {
      console.error("Error al actualizar el estado del estudiante:", updateError);
      return NextResponse.json({ message: 'Error interno al cambiar el estado del estudiante.' }, { status: 500 });
    }

    const message = `Estudiante ${activo ? 'activado' : 'desactivado'} con éxito.`;
    return NextResponse.json({ message, newStatus: activo }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en PATCH /api/students/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}

// --- DELETE for permanent deletion ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const studentId = params.id;

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { error: deleteError } = await supabaseAdmin
      .from('estudiantes')
      .delete()
      .eq('id', studentId);

    if (deleteError) {
        console.error('Error al eliminar el estudiante:', deleteError);
        return NextResponse.json({ message: 'Error interno al eliminar el estudiante: ' + deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Estudiante eliminado permanentemente con éxito.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en DELETE /api/students/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
