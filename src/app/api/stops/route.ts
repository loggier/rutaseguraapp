'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const stopSchema = z.object({
  estudiante_id: z.string().uuid(),
  colegio_id: z.string().uuid(),
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

// --- POST para crear una nueva parada ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = stopSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { estudiante_id, colegio_id, tipo, sub_tipo, direccion, calle, numero, lat, lng, activo } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // Si esta parada se va a activar, desactivar las demás para el mismo estudiante
    if (activo) {
        const { error: updateError } = await supabaseAdmin
            .from('paradas')
            .update({ activo: false })
            .eq('estudiante_id', estudiante_id)
            .eq('activo', true);

        if (updateError) {
            console.error('Error desactivando otras paradas:', updateError);
            return NextResponse.json({ message: 'Error al actualizar las paradas existentes.' }, { status: 500 });
        }
    }
    
    // Crear la nueva parada
    const { data: newStop, error: insertError } = await supabaseAdmin
      .from('paradas')
      .insert({ estudiante_id, colegio_id, tipo, sub_tipo, direccion, calle, numero, lat, lng, activo })
      .select()
      .single();

    if (insertError) {
        console.error('Error al crear la parada:', insertError);
        // Manejar el error de unicidad (estudiante_id, tipo)
        if (insertError.code === '23505') { // unique_violation
            return NextResponse.json({ message: `Ya existe una parada de tipo '${tipo}' para este estudiante.` }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error interno al crear la parada: ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Parada creada con éxito', stop: newStop }, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado en POST /api/stops:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
