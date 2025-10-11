'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { User } from '@/contexts/user-context';

const formSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  hora_salida_manana: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)").optional().or(z.literal('')),
  hora_salida_tarde: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)").optional().or(z.literal('')),
  colegio_id: z.string({ required_error: 'Debes seleccionar un colegio' }).uuid('ID de colegio inválido.'),
}).refine(data => data.hora_salida_manana || data.hora_salida_tarde, {
    message: "Se debe proporcionar al menos una hora de salida.",
    path: ["hora_salida_manana"],
});


export type State = {
  message?: string | null;
  errors?: {
    nombre?: string[];
    hora_salida_manana?: string[];
    hora_salida_tarde?: string[];
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

export async function updateRoute(routeId: string, user: User, prevState: State, formData: FormData): Promise<State> {
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
    hora_salida_manana: formData.get('hora_salida_manana'),
    hora_salida_tarde: formData.get('hora_salida_tarde'),
    colegio_id: colegio_id_from_form,
  });
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios o tienen formato incorrecto. No se pudo actualizar la ruta.',
    };
  }

  const { nombre, hora_salida_manana, hora_salida_tarde, colegio_id } = validatedFields.data;

  try {
    const { error } = await supabaseAdmin
      .from('rutas')
      .update({
        nombre,
        hora_salida_manana: hora_salida_manana || null,
        hora_salida_tarde: hora_salida_tarde || null,
        colegio_id,
      })
      .eq('id', routeId);

    if (error) {
      console.error('Error al actualizar la ruta:', error);
      if (error.code === '23505') { // unique constraint violation
        return { message: 'Error: Ya existe una ruta con este nombre para el colegio seleccionado.' };
      }
      return { message: `Error en la base de datos: ${error.message}` };
    }
  } catch (e: any) {
    return {
      message: 'Error: Ocurrió un error inesperado al actualizar la ruta.',
    };
  }

  revalidatePath('/dashboard/routes');
  revalidatePath(`/dashboard/routes/${routeId}/edit`);
  redirect('/dashboard/routes');
}
