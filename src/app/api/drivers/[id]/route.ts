'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import type { User } from '@/contexts/user-context';

const driverSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  licencia: z.string().min(1, 'La licencia es requerida'),
  telefono: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  colegio_id: z.string().uuid('ID de colegio inválido').optional().nullable(),
});

const statusSchema = z.object({
  activo: z.boolean(),
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
  const driverId = params.id;
  try {
    const body = await request.json();
    const { user }: { user: User } = body;
    
    if (!user) {
        return NextResponse.json({ message: "Usuario no autenticado." }, { status: 401 });
    }

    const validation = driverSchema.safeParse(body.driverData);
    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, apellido, licencia, telefono, avatar_url } = validation.data;
    let { colegio_id } = validation.data;

    const supabaseAdmin = createSupabaseAdminClient();

    if (user.rol === 'colegio') {
      const { data, error } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', user.id).single();
      if (error || !data) {
        return NextResponse.json({ message: 'No se pudo encontrar el colegio para este usuario.' }, { status: 404 });
      }
      colegio_id = data.id;
    } else if (!colegio_id) {
        return NextResponse.json({ message: "Se debe seleccionar un colegio." }, { status: 400 });
    }

    const { data: updatedDriver, error: updateError } = await supabaseAdmin
      .from('conductores')
      .update({
        nombre,
        apellido,
        licencia,
        telefono,
        avatar_url,
        colegio_id,
      })
      .eq('id', driverId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al actualizar conductor:', updateError);
      return NextResponse.json({ message: 'Error interno al actualizar el conductor: ' + updateError.message }, { status: 500 });
    }

    const { data: driverWithJoins, error: joinError } = await supabaseAdmin
        .from('conductores_view')
        .select('*')
        .eq('id', updatedDriver.id)
        .single();

    if(joinError) {
        console.error('Error fetching joined driver data after update:', joinError);
        return NextResponse.json({ message: 'Conductor actualizado, pero hubo un error al obtener datos relacionados.', driver: updatedDriver }, { status: 200 });
    }

    return NextResponse.json({ message: 'Conductor actualizado con éxito', driver: driverWithJoins }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en PUT /api/drivers/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const driverId = params.id;
  try {
    const body = await request.json();
    const validation = statusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos (se esperaba 'activo').", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { activo } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from('conductores')
      .update({ activo })
      .eq('id', driverId)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar el estado del conductor:", error);
      return NextResponse.json({ message: 'Error interno al cambiar el estado del conductor.' }, { status: 500 });
    }

    const message = `Conductor ${activo ? 'activado' : 'desactivado'} con éxito.`;
    return NextResponse.json({ message, newStatus: data.activo }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en PATCH /api/drivers/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const driverId = params.id;

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // Check if driver is assigned to a bus
    const { data: bus, error: busError } = await supabaseAdmin
        .from('autobuses')
        .select('id')
        .eq('conductor_id', driverId)
        .limit(1);

    if (busError) throw busError;

    if (bus && bus.length > 0) {
        return NextResponse.json({ message: 'No se puede eliminar al conductor porque está asignado a uno o más autobuses.' }, { status: 409 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('conductores')
      .delete()
      .eq('id', driverId);

    if (deleteError) {
        console.error('Error al eliminar el conductor:', deleteError);
        return NextResponse.json({ message: 'Error interno al eliminar el conductor: ' + deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Conductor eliminado con éxito.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en DELETE /api/drivers/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
