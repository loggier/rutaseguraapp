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

export async function POST(request: Request) {
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

    // Create the bus record
    const { data: newBus, error: insertError } = await supabaseAdmin
      .from('autobuses')
      .insert({
        matricula,
        capacidad,
        imei_gps,
        estado,
        colegio_id,
        conductor_id,
        ruta_id,
        creado_por: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear autobús:', insertError);
      return NextResponse.json({ message: 'Error interno al crear el autobús: ' + insertError.message }, { status: 500 });
    }
    
    // Fetch joined data for the response
    const { data: busWithJoins, error: joinError } = await supabaseAdmin
        .from('autobuses_view')
        .select('*')
        .eq('id', newBus.id)
        .single();
    
    if(joinError) {
        console.error('Error fetching joined bus data:', joinError);
        // Return the basic data if join fails
        return NextResponse.json({ message: 'Autobús creado, pero hubo un error al obtener datos relacionados.', bus: newBus }, { status: 201 });
    }

    return NextResponse.json({ message: 'Autobús creado con éxito', bus: busWithJoins }, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado en POST /api/buses:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
