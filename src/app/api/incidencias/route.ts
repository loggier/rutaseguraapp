'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

// Zod schema for validating the incoming request body
const incidenceSchema = z.object({
  estudiante_id: z.string().uuid(),
  padre_id: z.string().uuid(),
  colegio_id: z.string().uuid(),
  tipo_solicitud: z.enum(['video', 'imagen', 'general']),
  fecha_incidente: z.string().datetime(),
  observacion: z.string().min(10).max(500),
  // Opcional: si quieres permitir que se asignen en la creación
  ruta_id: z.string().uuid().optional().nullable(), 
  autobus_id: z.string().uuid().optional().nullable(),
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

// --- POST para crear una nueva incidencia ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = incidenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { 
        estudiante_id, 
        padre_id, 
        colegio_id, 
        tipo_solicitud, 
        fecha_incidente, 
        observacion,
        ruta_id,
        autobus_id
    } = validation.data;

    const supabaseAdmin = createSupabaseAdminClient();

    // Crear el registro en la tabla de incidencias
    const { data: newIncidence, error: insertError } = await supabaseAdmin
      .from('incidencias')
      .insert({
        estudiante_id,
        padre_id,
        colegio_id,
        tipo_solicitud,
        fecha_incidente,
        observacion,
        // El estado 'status' por defecto es 'nuevo' según la DDL
        ruta_id: ruta_id,
        autobus_id: autobus_id
      })
      .select()
      .single();

    if (insertError) {
        console.error('Error al crear la incidencia:', insertError);
        return NextResponse.json({ message: 'Error interno al crear la incidencia: ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Incidencia reportada con éxito', incidence: newIncidence }, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado en POST /api/incidencias:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
