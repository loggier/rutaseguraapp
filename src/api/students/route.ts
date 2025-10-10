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
    console.log("-> generateNextStudentId: Buscando último student_id...");
    const { data, error } = await client
        .from('estudiantes')
        .select('student_id')
        .order('student_id', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = single row not found
        console.error("-> generateNextStudentId: Error fetching last student ID:", error);
        throw error;
    }
    
    let nextId = 1;
    if (data?.student_id) {
        console.log(`-> generateNextStudentId: Último ID encontrado: ${data.student_id}`);
        const lastId = parseInt(data.student_id, 10);
        if (!isNaN(lastId)) {
            nextId = lastId + 1;
        }
    } else {
        console.log("-> generateNextStudentId: No se encontraron IDs existentes, empezando en 1.");
    }
    
    const newStudentId = nextId.toString().padStart(6, '0');
    console.log(`-> generateNextStudentId: Nuevo ID generado: ${newStudentId}`);
    return newStudentId;
}


export async function POST(request: Request) {
  console.log("API /api/students POST: Petición recibida.");
  const body = await request.json();
  console.log("API /api/students POST: Body parseado:", body);

  const validation = studentSchema.safeParse(body);
  if (!validation.success) {
    console.error("API /api/students POST: Falló la validación.", validation.error.flatten());
    return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }
  console.log("API /api/students POST: Validación exitosa.");

  const { nombre, apellido, email, telefono, avatar_url, padre_id, creador_id, user_rol } = validation.data;
  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Determine the colegio_id
  console.log(`API /api/students POST: Determinando colegio_id para rol de usuario: ${user_rol}`);
  let colegio_id: string;
  if (user_rol === 'colegio') {
    const { data, error } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', creador_id).single();
    if (error || !data) {
      console.error(`API /api/students POST: No se encontró colegio para el creador ${creador_id}`, error);
      return NextResponse.json({ message: 'No se pudo encontrar el colegio para este usuario.' }, { status: 404 });
    }
    colegio_id = data.id;
    console.log(`API /api/students POST: Creador es un colegio. ID de colegio: ${colegio_id}`);
  } else { // master or manager
    const { data, error } = await supabaseAdmin.from('profiles').select('colegio_id').eq('id', padre_id).single();
      if (error || !data?.colegio_id) {
      console.error(`API /api/students POST: El padre ${padre_id} no tiene un colegio_id asignado.`, error);
      return NextResponse.json({ message: 'El padre seleccionado no está asignado a ningún colegio.' }, { status: 400 });
    }
    colegio_id = data.colegio_id;
    console.log(`API /api/students POST: Creador es admin. ID de colegio del padre: ${colegio_id}`);
  }

  // 2. Generate the next student ID
  console.log("API /api/students POST: Iniciando generación de student_id...");
  const student_id = await generateNextStudentId(supabaseAdmin);
  console.log(`API /api/students POST: student_id generado: ${student_id}`);
  
  // 3. Create the student record
  console.log("API /api/students POST: Intentando insertar estudiante en la base de datos...");
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
    console.error('API /api/students POST: Error al crear estudiante:', studentError);
    return NextResponse.json({ message: 'Error interno al crear el estudiante: ' + studentError?.message }, { status: 500 });
  }
  
  console.log("API /api/students POST: Estudiante creado con éxito:", newStudent.id);
  const responseData = {
      ...newStudent,
      padre_nombre: newStudent.padre ? `${newStudent.padre.nombre} ${newStudent.padre.apellido}` : 'No asignado',
      padre_email: newStudent.padre ? newStudent.padre.email : '-',
      colegio_nombre: newStudent.colegio ? newStudent.colegio.nombre : 'No asignado'
  };

  console.log("API /api/students POST: Enviando respuesta exitosa.");
  return NextResponse.json({ message: 'Estudiante creado con éxito', student: responseData }, { status: 201 });
}
