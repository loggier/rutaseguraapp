'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hashPassword } from '@/lib/auth-utils';

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
  email: z.string().email('El email de la cuenta es inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  creado_por: z.string().uuid(),
});

export type State = {
  message?: string | null;
  errors?: {
    nombre?: string[];
    ruc?: string[];
    email_contacto?: string[];
    telefono?: string[];
    direccion?: string[];
    lat?: string[];
    lng?: string[];
    email?: string[];
    password?: string[];
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

export async function createSchool(prevState: State, formData: FormData): Promise<State> {
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
    email: formData.get('email'),
    password: formData.get('password'),
    creado_por: formData.get('creado_por'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios. No se pudo crear el colegio.',
    };
  }

  const { nombre, ruc, email_contacto, telefono, direccion, lat, lng, calle, numero, email, password, creado_por } = validatedFields.data;
  const supabaseAdmin = createSupabaseAdminClient();
  const hashedPassword = await hashPassword(password);
  
  try {
    const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', email).single();
    if (existingUser) {
        return { message: 'Ya existe un usuario con este correo electrónico.' };
    }
    const { data: existingSchool } = await supabaseAdmin.from('colegios').select('id').eq('ruc', ruc).single();
    if (existingSchool) {
        return { message: 'Ya existe un colegio con este RUC.' };
    }
    
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({ email, password: hashedPassword, activo: true })
      .select('id')
      .single();

    if (userError || !newUser) throw new Error('Error al crear la cuenta de usuario: ' + userError?.message);
    
    const newUserId = newUser.id;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: newUserId, rol: 'colegio', nombre, apellido: 'Colegio' });
    
    if (profileError) {
      await supabaseAdmin.from('users').delete().eq('id', newUserId);
      throw new Error('Error al crear el perfil: ' + profileError.message);
    }

    const { error: schoolError } = await supabaseAdmin
      .from('colegios')
      .insert({
        usuario_id: newUserId, 
        nombre, 
        ruc, 
        email_contacto, 
        telefono, 
        direccion,
        lat,
        lng,
        calle,
        numero,
        codigo_postal: '', // Campo no utilizado
        creado_por, 
        activo: true
      });

    if (schoolError) {
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId); 
      await supabaseAdmin.from('users').delete().eq('id', newUserId);
      throw new Error('Error al registrar los datos del colegio: ' + schoolError?.message);
    }

  } catch (e: any) {
    return { message: e.message };
  }

  revalidatePath('/dashboard/schools');
  redirect('/dashboard/schools');
}
