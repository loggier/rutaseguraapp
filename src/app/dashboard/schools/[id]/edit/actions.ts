'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre del colegio es requerido'),
  ruc: z.string().length(13, 'El RUC debe tener 13 dígitos'),
  email_contacto: z.string().email('Email de contacto inválido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  calle: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
});

export type State = {
  message?: string | null;
  errors?: {
    nombre?: string[];
    ruc?: string[];
    email_contacto?: string[];
    telefono?: string[];
    direccion?: string[];
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

export async function updateSchool(schoolId: string, prevState: State, formData: FormData): Promise<State> {
  const validatedFields = formSchema.safeParse({
    nombre: formData.get('nombre'),
    ruc: formData.get('ruc'),
    email_contacto: formData.get('email_contacto'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
    calle: formData.get('calle'),
    numero: formData.get('numero'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios. No se pudo actualizar el colegio.',
    };
  }

  const { nombre, ruc, email_contacto, telefono, direccion, lat, lng, calle, numero } = validatedFields.data;
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const { error } = await supabaseAdmin
      .from('colegios')
      .update({
        nombre,
        ruc,
        email_contacto,
        telefono,
        direccion,
        lat,
        lng,
        calle,
        numero,
      })
      .eq('id', schoolId);

    if (error) {
      console.error('Error al actualizar colegio:', error);
      return { message: `Error en la base de datos: ${error.message}` };
    }
  } catch (e: any) {
    return {
      message: 'Ocurrió un error inesperado al actualizar el colegio.',
    };
  }

  revalidatePath('/dashboard/schools');
  revalidatePath(`/dashboard/schools/${schoolId}/edit`);
  redirect('/dashboard/schools');
}
