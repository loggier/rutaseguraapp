'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import type { User } from '@/contexts/user-context';


const busSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida'),
  capacidad: z.coerce.number().int().min(1, 'La capacidad debe ser mayor a 0'),
  imei_gps: z.string().min(1, 'El IMEI del GPS es requerido'),
  estado: z.enum(['activo', 'inactivo', 'mantenimiento']),
  colegio_id: z.string().uuid('ID de colegio inválido').optional().nullable(),
  conductor_id: z.string().uuid('ID de conductor inválido').optional().nullable(),
  ruta_id: z.string().uuid('ID de ruta inválido').optional().nullable(),
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


export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const busId = params.id;
  try {
    const body = await request.json();
    const { user }: { user: User } = body;
    
    if (!user) {
        return NextResponse.json({ message: "Usuario no autenticado." }, { status: 401 });
    }

    const validation = busSchema.safeParse(body.busData);
    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { matricula, capacidad, imei_gps, estado, conductor_id, ruta_id } = validation.data;
    let { colegio_id } = validation.data;

    const supabaseAdmin = createSupabaseAdminClient();

    // If user is 'colegio', enforce their own colegio_id
    if (user.rol === 'colegio') {
      const { data, error } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', user.id).single();
      if (error || !data) {
        return NextResponse.json({ message: 'No se pudo encontrar el colegio para este usuario.' }, { status: 404 });
      }
      colegio_id = data.id;
    } else if (!colegio_id) {
        return NextResponse.json({ message: "Se debe seleccionar un colegio." }, { status: 400 });
    }

    // Update the bus record
    const { data: updatedBus, error: updateError } = await supabaseAdmin
      .from('autobuses')
      .update({
        matricula,
        capacidad,
        imei_gps,
        estado,
        colegio_id,
        conductor_id,
        ruta_id,
      })
      .eq('id', busId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al actualizar autobús:', updateError);
      return NextResponse.json({ message: 'Error interno al actualizar el autobús: ' + updateError.message }, { status: 500 });
    }

     // Fetch joined data for the response
    const { data: busWithJoins, error: joinError } = await supabaseAdmin
        .from('autobuses_view')
        .select('*')
        .eq('id', updatedBus.id)
        .single();

    if(joinError) {
        console.error('Error fetching joined bus data after update:', joinError);
        return NextResponse.json({ message: 'Autobús actualizado, pero hubo un error al obtener datos relacionados.', bus: updatedBus }, { status: 200 });
    }


    return NextResponse.json({ message: 'Autobús actualizado con éxito', bus: busWithJoins }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en PUT /api/buses/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const busId = params.id;

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { error: deleteError } = await supabaseAdmin
      .from('autobuses')
      .delete()
      .eq('id', busId);

    if (deleteError) {
        console.error('Error al eliminar el autobús:', deleteError);
        return NextResponse.json({ message: 'Error interno al eliminar el autobús: ' + deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Autobús eliminado con éxito.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en DELETE /api/buses/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
