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
  avatar_url: z.string().url().optional().nullable(),
});

export type State = {
  message?: string | null;
  errors?: {
    nombre?: string[];
    apellido?: string[];
    email?: string[];
    telefono?: string[];
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

export async function updateStudent(studentId: string, prevState: State, formData: FormData): Promise<State> {
  const validatedFields = formSchema.safeParse({
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    avatar_url: formData.get('avatar_url') || null,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios. No se pudo actualizar el estudiante.',
    };
  }

  const { nombre, apellido, telefono, avatar_url } = validatedFields.data;
  const email = validatedFields.data.email || null; // Convertir '' a null
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const { error } = await supabaseAdmin
      .from('estudiantes')
      .update({
        nombre,
        apellido,
        email,
        telefono,
        avatar_url,
      })
      .eq('id', studentId);

    if (error) {
      console.error('Error al actualizar estudiante:', error);
      return { message: `Error en la base de datos: ${error.message}` };
    }
  } catch (e: any) {
    return {
      message: 'Ocurrió un error inesperado al actualizar el estudiante.',
    };
  }

  revalidatePath('/dashboard/students');
  revalidatePath(`/dashboard/students/${studentId}/edit`);
  redirect('/dashboard/students');
}
