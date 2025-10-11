
'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { User } from '@/contexts/user-context';

const formSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  turno: z.enum(['Recogida', 'Entrega'], { required_error: 'Debes seleccionar un turno.' }),
  hora_salida: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)"),
  colegio_id: z.string({ required_error: 'Debes seleccionar un colegio' }).uuid('ID de colegio inválido.'),
  creado_por: z.string().uuid(),
});

export type State = {
  message?: string | null;
  errors?: {
    nombre?: string[];
    turno?: string[];
    hora_salida?: string[];
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

export async function createRoute(user: User, prevState: State, formData: FormData): Promise<State> {
    const supabaseAdmin = createSupabaseAdminClient();
    
    let colegio_id_from_form: string | null = formData.get('colegio_id') as string | null;

    if (user.rol === 'colegio') {
        const {data: colegioData, error} = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', user.id).single();
        if(error || !colegioData) {
             return { message: 'Error: No se pudo encontrar el colegio para este usuario.' };
        }
        colegio_id_from_form = colegioData.id;
    }

  const validatedFields = formSchema.safeParse({
    nombre: formData.get('nombre'),
    turno: formData.get('turno'),
    hora_salida: formData.get('hora_salida'),
    colegio_id: colegio_id_from_form,
    creado_por: user.id,
  });
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios o tienen formato incorrecto. No se pudo crear la ruta.',
    };
  }

  const { nombre, turno, hora_salida, colegio_id } = validatedFields.data;

  try {
    const { error } = await supabaseAdmin
      .from('rutas')
      .insert({
        nombre,
        turno,
        hora_salida,
        colegio_id,
        creado_por: user.id
      });

    if (error) {
      console.error('Error al crear ruta:', error);
      if (error.code === '23505') { // unique constraint violation
        return { message: 'Error: Ya existe una ruta con este nombre para el colegio seleccionado.' };
      }
      return { message: `Error en la base de datos: ${error.message}` };
    }
  } catch (e: any) {
    return {
      message: 'Error: Ocurrió un error inesperado al crear la ruta.',
    };
  }

  revalidatePath('/dashboard/routes');
  redirect('/dashboard/routes');
}
