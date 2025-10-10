'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import type { Profile } from '@/lib/types';

const studentSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  apellido: z.string().min(1, "El apellido es requerido."),
  email: z.string().email("El email no es válido.").optional().nullable().or(z.literal('')),
  telefono: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  padre_id: z.string().uuid("ID de padre/tutor inválido."),
  creador_id: z.string().uuid("ID de creador inválido."),
  user_rol: z.enum(['master', 'manager', 'colegio', 'padre']),
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

// Function to generate the next auto-incrementing student ID
async function generateNextStudentId(client: ReturnType<typeof createSupabaseAdminClient>): Promise<string> {
    const { data, error } = await client
        .from('estudiantes')
        .select('student_id')
        .order('student_id', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        console.error("Error fetching last student ID:", error);
        throw new Error('Error al generar el ID de estudiante.');
    }
    
    let nextId = 1;
    if (data?.student_id) {
        const lastId = parseInt(data.student_id, 10);
        if (!isNaN(lastId)) {
            nextId = lastId + 1;
        }
    }
    
    return nextId.toString().padStart(6, '0');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, apellido, email, telefono, avatar_url, padre_id, creador_id, user_rol } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Determine the colegio_id
    let colegio_id: string;
    if (user_rol === 'colegio') {
      const { data, error } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', creador_id).single();
      if (error || !data) {
        return NextResponse.json({ message: 'No se pudo encontrar el colegio para este usuario.' }, { status: 404 });
      }
      colegio_id = data.id;
    } else { // master or manager
      const { data, error } = await supabaseAdmin.from('profiles').select('colegio_id').eq('id', padre_id).single();
       if (error || !data?.colegio_id) {
        return NextResponse.json({ message: 'El padre seleccionado no está asignado a ningún colegio.' }, { status: 400 });
      }
      colegio_id = data.colegio_id;
    }

    // 2. Generate a unique student ID
    const student_id = await generateNextStudentId(supabaseAdmin);
    
    // 3. Create the student record
    const { data: newStudent, error: studentError } = await supabaseAdmin
      .from('estudiantes')
      .insert({
        nombre,
        apellido,
        email,
        telefono,
        avatar_url,
        padre_id,
        colegio_id,
        student_id,
        creado_por: creador_id,
      })
      .select(`
        *,
        padre:profiles(nombre, apellido, email),
        colegio:colegios(nombre)
      `)
      .single();

    if (studentError || !newStudent) {
      console.error('Error al crear estudiante:', studentError);
      return NextResponse.json({ message: 'Error interno al crear el estudiante: ' + studentError?.message }, { status: 500 });
    }
    
    const responseData = {
        ...newStudent,
        padre_nombre: newStudent.padre ? `${newStudent.padre.nombre} ${newStudent.padre.apellido}` : 'No asignado',
        padre_email: newStudent.padre ? newStudent.padre.email : '-',
        colegio_nombre: newStudent.colegio ? newStudent.colegio.nombre : 'No asignado'
    };

    return NextResponse.json({ message: 'Estudiante creado con éxito', student: responseData }, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado en la API de creación de estudiantes:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
