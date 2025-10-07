'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

// Definición del tipo para el usuario con su contraseña hasheada
type UserWithPassword = {
  id: string;
  password: string; // Este es el hash de la contraseña desde la BD
};

// Función helper para verificar la contraseña llamando a una función RPC de PostgreSQL
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Se crea un cliente con privilegios de servicio para poder llamar a la función RPC.
  // Es crucial pasarle un objeto de cookies con funciones vacías para que no intente usar la sesión del cliente.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
      db: { schema: 'rutasegura' }
    }
  );

  // Llamada a la función 'verify_password' definida en la base de datos
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
  try {
    const { email, password } = await request.json();

    // 1. Validar que se recibieron los datos necesarios
    if (!email || !password) {
      return NextResponse.json({ message: 'Correo electrónico y contraseña son requeridos.' }, { status: 400 });
    }
    
    // Se crea un cliente de Supabase con rol de servicio para esta operación.
    // Esto es necesario para poder leer la tabla 'users' que no debe ser pública.
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
            get: () => undefined,
            set: () => {},
            remove: () => {},
        },
        db: {
          schema: 'rutasegura',
        },
      }
    );

    // 2. Buscar al usuario por email en la tabla 'users'
    const { data: user, error: userError }: PostgrestSingleResponse<UserWithPassword> = await supabaseAdmin
      .from('users')
      .select('id, password')
      .eq('email', email)
      .single();

    // 3. Si el usuario no existe, devolver error de credenciales inválidas.
    if (userError || !user) {
      console.error('Error de BD o usuario no encontrado para:', email, userError);
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 4. Verificar la contraseña usando la función segura de la base de datos
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      console.error('Intento de contraseña inválida para el usuario:', email);
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 5. Si las credenciales son válidas, obtener el perfil completo del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nombre, apellido, rol')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error: No se pudo encontrar el perfil para el usuario con ID:', user.id, profileError);
      return NextResponse.json({ message: 'Error interno: no se pudo encontrar el perfil del usuario.' }, { status: 500 });
    }

    // 6. Construir y devolver la respuesta exitosa con los datos del usuario
    const sessionData = {
      id: user.id,
      email: email,
      nombre: profile.nombre,
      apellido: profile.apellido,
      rol: profile.rol,
    };

    return NextResponse.json({ message: 'Inicio de sesión exitoso', user: sessionData }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en la API de Login:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
