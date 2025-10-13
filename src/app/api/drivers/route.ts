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

    const validation = driverSchema.safeParse(body.driverData);
    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, apellido, licencia, telefono, avatar_url } = validation.data;
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

    // Create the driver record
    const { data: newDriver, error: insertError } = await supabaseAdmin
      .from('conductores')
      .insert({
        nombre,
        apellido,
        licencia,
        telefono,
        avatar_url,
        colegio_id,
        creado_por: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear conductor:', insertError);
      return NextResponse.json({ message: 'Error interno al crear el conductor: ' + insertError.message }, { status: 500 });
    }
    
    // Fetch joined data for the response
    const { data: driverWithJoins, error: joinError } = await supabaseAdmin
        .from('conductores_view')
        .select('*')
        .eq('id', newDriver.id)
        .single();
    
    if(joinError) {
        console.error('Error fetching joined driver data:', joinError);
        return NextResponse.json({ message: 'Conductor creado, pero hubo un error al obtener datos relacionados.', driver: newDriver }, { status: 201 });
    }

    return NextResponse.json({ message: 'Conductor creado con éxito', driver: driverWithJoins }, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado en POST /api/drivers:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
