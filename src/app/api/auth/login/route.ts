'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// **Cliente de Administrador para la API**
// Se usa supabase-js con la SERVICE_ROLE_KEY para realizar operaciones con privilegios de administrador,
// como consultar la tabla de usuarios y verificar contraseñas, lo cual no es posible con la anon_key.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'rutasegura'
    }
  }
);

/**
 * Verifica la contraseña en texto plano contra el hash almacenado en la base de datos
 * utilizando la función crypt() de pgcrypto.
 * @param password - La contraseña en texto plano.
 * @param hash - El hash almacenado en la base de datos.
 * @returns - True si la contraseña es válida, false en caso contrario.
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('verify_password', {
    password: password,
    hash: hash,
  });

  if (error) {
    console.error('Error al verificar la contraseña:', error);
    return false;
  }
  return data;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Correo electrónico y contraseña son requeridos.' }, { status: 400 });
    }

    // 1. Buscar al usuario por email en la tabla 'users'
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, password')
      .eq('email', email)
      .single();

    if (userError || !user) {
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
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ message: 'No se pudo encontrar el perfil del usuario.' }, { status: 404 });
    }

    // 4. Combinar la información y prepararla para la sesión
    // En un futuro, aquí se generaría un token JWT y se enviaría como una cookie HttpOnly.
    const sessionData = {
      id: user.id,
      email: email, // El email no está en la tabla de perfiles
      nombre: profile.nombre,
      apellido: profile.apellido,
      rol: profile.rol,
    };

    return NextResponse.json({ message: 'Inicio de sesión exitoso', user: sessionData }, { status: 200 });

  } catch (error) {
    console.error('Error en la API de Login:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
