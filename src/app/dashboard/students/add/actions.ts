'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  padre_id: z.string({ required_error: "Debes seleccionar un padre/tutor."}).uuid('Debes seleccionar un padre/tutor'),
  avatar_url: z.string().url().optional().nullable(),
  creador_id: z.string().uuid(),
  user_rol: z.enum(['master', 'manager', 'colegio', 'padre']),
});

export type State = {
  message?: string | null;
  errors?: {
    nombre?: string[];
    apellido?: string[];
    email?: string[];
    telefono?: string[];
    padre_id?: string[];
    _form?: string[];
  };
};

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

export async function createStudent(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = formSchema.safeParse({
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    padre_id: formData.get('padre_id'),
    avatar_url: formData.get('avatar_url') || null,
    creador_id: formData.get('creador_id'),
    user_rol: formData.get('user_rol'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios. No se pudo crear el estudiante.',
    };
  }

  const { nombre, apellido, email, telefono, avatar_url, padre_id, creador_id, user_rol } = validatedFields.data;
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    let colegio_id: string;

    if (user_rol === 'colegio') {
      const { data, error } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', creador_id).single();
      if (error || !data) {
        return { message: 'Error: No se pudo encontrar el colegio para este usuario.' };
      }
      colegio_id = data.id;
    } else { // master or manager
      const { data, error } = await supabaseAdmin.from('profiles').select('colegio_id').eq('id', padre_id).single();
       if (error || !data?.colegio_id) {
        return { message: 'Error: El padre seleccionado no está asignado a ningún colegio.' };
      }
      colegio_id = data.colegio_id;
    }

    const student_id = await generateNextStudentId(supabaseAdmin);
    
    const { error: insertError } = await supabaseAdmin
      .from('estudiantes')
      .insert({
        nombre,
        apellido,
        email: email || null,
        telefono,
        avatar_url,
        padre_id,
        colegio_id,
        student_id,
        creado_por: creador_id,
      });

    if (insertError) {
      console.error(insertError);
      return { message: `Error en la base de datos: ${insertError.message}` };
    }
  } catch (e: any) {
    return {
      message: 'Ocurrió un error inesperado al crear el estudiante.',
    };
  }

  revalidatePath('/dashboard/students');
  redirect('/dashboard/students');
}
