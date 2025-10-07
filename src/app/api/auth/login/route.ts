'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifyPassword } from '@/lib/auth-utils';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

// Definición del tipo para la respuesta de la tabla 'users'
type UserData = {
  id: string;
  password: string; // Este es el hash de la contraseña desde la BD
  activo: boolean;
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Validar que se recibieron los datos necesarios
    if (!email || !password) {
      return NextResponse.json({ message: 'Correo electrónico y contraseña son requeridos.' }, { status: 400 });
    }
    
    // Se crea un cliente de Supabase con rol de servicio para esta operación.
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
    const { data: user, error: userError }: PostgrestSingleResponse<UserData> = await supabaseAdmin
      .from('users')
      .select('id, password, activo')
      .eq('email', email)
      .single();

    // 3. Si el usuario no existe, devolver error de credenciales inválidas.
    if (userError || !user) {
      console.error('Error de BD o usuario no encontrado para:', email, userError);
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }
    
    // 4. Verificar si el usuario está activo
    if (!user.activo) {
        return NextResponse.json({ message: 'El usuario se encuentra inactivo.' }, { status: 403 });
    }

    // 5. Verificar la contraseña usando bcrypt
    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 6. Si las credenciales son válidas, obtener el perfil completo del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nombre, apellido, rol')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error: No se pudo encontrar el perfil para el usuario con ID:', user.id, profileError);
      return NextResponse.json({ message: 'Error interno: no se pudo encontrar el perfil del usuario.' }, { status: 500 });
    }

    // 7. Construir y devolver la respuesta exitosa con los datos del usuario
    const sessionData = {
      id: user.id,
      email: email,
      nombre: profile.nombre,
      apellido: profile.apellido,
      rol: profile.rol,
      activo: user.activo,
    };

    return NextResponse.json({ message: 'Inicio de sesión exitoso', user: sessionData }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en la API de Login:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
