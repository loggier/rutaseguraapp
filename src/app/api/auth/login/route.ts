'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

type UserWithPassword = {
  id: string;
  password: string;
};

/**
 * Verifica la contraseña en texto plano contra el hash almacenado en la base de datos
 * utilizando la función crypt() de pgcrypto.
 * @param password - La contraseña en texto plano.
 * @param hash - El hash almacenado en la base de datos.
 * @returns - True si la contraseña es válida, false en caso contrario.
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // El cliente se crea aquí para asegurar el acceso a las variables de entorno en el momento de la ejecución.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'rutasegura' }
    }
  );

  const { data, error } = await supabase.rpc('verify_password', {
    password: password,
    hash: hash,
  });

  if (error) {
    console.error('Error al verificar la contraseña con RPC:', error);
    return false;
  }
  return data;
}

export async function POST(request: Request) {
  // El cliente de administrador se debe crear dentro de la función
  // para garantizar que las variables de entorno estén disponibles en el entorno del servidor.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'rutasegura',
      },
    }
  );

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Correo electrónico y contraseña son requeridos.' }, { status: 400 });
    }

    // 1. Buscar al usuario por email en la tabla 'users'
    const { data: user, error: userError }: PostgrestSingleResponse<UserWithPassword> = await supabaseAdmin
      .from('users')
      .select('id, password')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('Error buscando usuario o usuario no encontrado:', userError);
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 2. Verificar la contraseña usando la función de la BD
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 3. Si la contraseña es válida, obtener el perfil completo del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nombre, apellido, rol')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ message: 'No se pudo encontrar el perfil del usuario.' }, { status: 404 });
    }

    // 4. Combinar la información y prepararla para la sesión
    const sessionData = {
      id: user.id,
      email: email, // Usamos el email que ya tenemos de la petición
      nombre: profile.nombre,
      apellido: profile.apellido,
      rol: profile.rol,
    };

    // TODO: En el futuro, aquí se generaría y firmaría un token JWT
    // y se establecería en una cookie HttpOnly.
    return NextResponse.json({ message: 'Inicio de sesión exitoso', user: sessionData }, { status: 200 });

  } catch (error) {
    console.error('Error en la API de Login:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
