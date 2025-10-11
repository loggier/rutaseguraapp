'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const updateStopSchema = z.object({
  tipo: z.enum(['Recogida', 'Entrega']),
  sub_tipo: z.enum(['Principal', 'Familiar/Academia']),
  direccion: z.string().min(5, 'La dirección es requerida.'),
  calle: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  lat: z.number(),
  lng: z.number(),
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

// --- PUT para actualizar una parada ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const stopId = params.id;
  
  try {
    const body = await request.json();
    const validation = updateStopSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { tipo, sub_tipo, direccion, calle, numero, lat, lng, activo } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();
    
    // Obtener el estudiante_id de la parada que se está actualizando
    const { data: currentStopData, error: currentStopError } = await supabaseAdmin.from('paradas').select('estudiante_id').eq('id', stopId).single();
    if (currentStopError || !currentStopData) {
        return NextResponse.json({ message: 'La parada que intentas actualizar no existe.' }, { status: 404 });
    }

    // Verificar si ya existe otra parada con el mismo tipo y subtipo
     const { data: existingStop } = await supabaseAdmin
        .from('paradas')
        .select('id')
        .eq('estudiante_id', currentStopData.estudiante_id)
        .eq('tipo', tipo)
        .eq('sub_tipo', sub_tipo)
        .neq('id', stopId) // Excluir la parada actual de la verificación
        .maybeSingle(); // Usar maybeSingle para no lanzar error si no existe
    
    if (existingStop) {
        return NextResponse.json({ message: `Ya existe una parada de tipo '${tipo}' y subtipo '${sub_tipo}' para este estudiante.` }, { status: 409 });
    }

    // Si esta parada se va a activar, desactivar las demás del MISMO TIPO para el mismo estudiante
    if (activo) {
        const { error: updateError } = await supabaseAdmin
            .from('paradas')
            .update({ activo: false })
            .eq('estudiante_id', currentStopData.estudiante_id)
            .eq('tipo', tipo) // Solo desactivar las del mismo tipo
            .neq('id', stopId) // No desactivar la parada actual
            .eq('activo', true);

        if (updateError) {
            console.error('Error desactivando otras paradas del mismo tipo:', updateError);
            return NextResponse.json({ message: 'Error al actualizar las paradas existentes.' }, { status: 500 });
        }
    }

    // Actualizar la parada
    const { data: updatedStop, error: updateError } = await supabaseAdmin
      .from('paradas')
      .update({ tipo, sub_tipo, direccion, calle, numero, lat, lng, activo })
      .eq('id', stopId)
      .select()
      .single();
      
    if (updateError) {
        console.error('Error al actualizar la parada:', updateError);
        // Manejar el error de unicidad que ahora es (estudiante_id, tipo, sub_tipo)
        if (updateError.code === '23505') { // unique_violation
             return NextResponse.json({ message: `Ya existe una parada de tipo '${tipo}' y subtipo '${sub_tipo}' para este estudiante.` }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error interno al actualizar la parada: ' + updateError?.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Parada actualizada con éxito', stop: updatedStop }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en PUT /api/stops/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}

// --- DELETE para eliminar una parada ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const stopId = params.id;

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { error: deleteError } = await supabaseAdmin
      .from('paradas')
      .delete()
      .eq('id', stopId);

    if (deleteError) {
        console.error('Error al eliminar la parada:', deleteError);
        return NextResponse.json({ message: 'Error interno al eliminar la parada: ' + deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Parada eliminada con éxito.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en DELETE /api/stops/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
