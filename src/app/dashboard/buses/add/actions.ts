'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { User } from '@/contexts/user-context';

const formSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida'),
  capacidad: z.coerce.number().int().min(1, 'La capacidad debe ser mayor a 0'),
  imei_gps: z.string().min(1, 'El IMEI del GPS es requerido'),
  estado: z.enum(['activo', 'inactivo', 'mantenimiento'], {
    errorMap: () => ({ message: "Debes seleccionar un estado válido." })
  }),
  colegio_id: z.string({ required_error: 'Se debe seleccionar un colegio.' }).uuid('ID de colegio inválido'),
  conductor_id: z.string().uuid('ID de conductor inválido').optional().nullable(),
  ruta_id: z.string().uuid('ID de ruta inválido').optional().nullable(),
});

export type State = {
  message?: string | null;
  errors?: {
    matricula?: string[];
    capacidad?: string[];
    imei_gps?: string[];
    estado?: string[];
    colegio_id?: string[];
    conductor_id?: string[];
    ruta_id?: string[];
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

export async function createBus(user: User, prevState: State, formData: FormData): Promise<State> {
    const supabaseAdmin = createSupabaseAdminClient();
    
    let colegioIdFromForm = formData.get('colegio_id') as string | null;

    if (user.rol === 'colegio') {
        const { data: colegioData, error } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', user.id).single();
        if (error || !colegioData) {
             return { message: 'Error: No se pudo encontrar el colegio para este usuario.', errors: { _form: ['Error de autenticación de colegio.'] } };
        }
        colegioIdFromForm = colegioData.id;
    }
   
    const validatedFields = formSchema.safeParse({
        matricula: formData.get('matricula'),
        capacidad: formData.get('capacidad'),
        imei_gps: formData.get('imei_gps'),
        estado: formData.get('estado'),
        colegio_id: colegioIdFromForm,
        conductor_id: formData.get('conductor_id') || null,
        ruta_id: formData.get('ruta_id') || null,
    });
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos o tienen errores. Por favor, revisa el formulario.',
    };
  }

  const { matricula, capacidad, imei_gps, estado, colegio_id, conductor_id, ruta_id } = validatedFields.data;
  
  if (!colegio_id && user.rol !== 'colegio') {
    return {
      errors: { colegio_id: ['Se debe seleccionar un colegio.'] },
      message: 'Faltan campos obligatorios. No se pudo crear el autobús.',
    };
  }

  try {
    const { error } = await supabaseAdmin
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
      });

    if (error) {
      console.error('Error al crear autobús:', error);
      return { message: `Error en la base de datos: ${error.message}` };
    }
  } catch (e: any) {
    return {
      message: `Error inesperado: ${e.message}`,
    };
  }

  revalidatePath('/dashboard/buses');
  revalidatePath('/dashboard/drivers');
  redirect('/dashboard/buses');
}
