
'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { User } from '@/contexts/user-context';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  licencia: z.string().min(1, 'La licencia es requerida'),
  telefono: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  colegio_id: z.string({ required_error: 'Se debe seleccionar un colegio.' }).uuid('ID de colegio inválido').optional().nullable(),
});

export type State = {
  message?: string | null;
  errors?: {
    nombre?: string[];
    apellido?: string[];
    licencia?: string[];
    colegio_id?: string[];
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

export async function createDriver(user: User, prevState: State, formData: FormData): Promise<State> {
    const supabaseAdmin = createSupabaseAdminClient();
    
    let colegioIdFromForm = formData.get('colegio_id') as string | null;

    // For 'colegio' role, we enforce their own colegio_id
    if (user.rol === 'colegio') {
        const { data: colegioData, error } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', user.id).single();
        if (error || !colegioData) {
             return { message: 'Error: No se pudo encontrar el colegio para este usuario.' };
        }
        colegioIdFromForm = colegioData.id;
    }

    const validatedFields = formSchema.safeParse({
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        licencia: formData.get('licencia'),
        telefono: formData.get('telefono'),
        avatar_url: formData.get('avatar_url') || null,
        colegio_id: colegioIdFromForm,
    });
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios. No se pudo crear el conductor.',
    };
  }

  const { nombre, apellido, licencia, telefono, avatar_url, colegio_id } = validatedFields.data;
  
  if (!colegio_id) {
    return {
      errors: { colegio_id: ['Se debe seleccionar un colegio.'] },
      message: 'Faltan campos obligatorios. No se pudo crear el conductor.',
    };
  }

  try {
    const { error } = await supabaseAdmin
      .from('conductores')
      .insert({
        nombre,
        apellido,
        licencia,
        telefono,
        avatar_url,
        colegio_id,
        creado_por: user.id,
      });

    if (error) {
      console.error('Error al crear conductor:', error);
      return { message: `Error en la base de datos: ${error.message}` };
    }
  } catch (e: any) {
    return {
      message: `Error inesperado: ${e.message}`,
    };
  }

  revalidatePath('/dashboard/drivers');
  redirect('/dashboard/drivers');
}
