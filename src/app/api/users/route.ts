
'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth-utils';

const userSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  apellido: z.string().min(1, "El apellido es requerido."),
  email: z.string().email("El correo electrónico no es válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  rol: z.enum(['master', 'manager', 'colegio', 'padre']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombre, apellido, email, password, rol } = validation.data;

    const hashedPassword = await hashPassword(password);
    
    // Cliente con privilegios de servicio para poder crear usuarios
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

    // 1. Verificar si el email ya existe
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        return NextResponse.json({ message: 'Ya existe un usuario con este correo electrónico.' }, { status: 409 });
    }
    
    // 2. Crear el usuario en la tabla `users` con el campo `activo` en true
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email,
        password: hashedPassword,
        activo: true, // Aseguramos que el usuario se cree como activo
      })
      .select('id')
      .single();

    if (userError || !newUser) {
      console.error('Error al crear usuario en `users`:', userError);
      return NextResponse.json({ message: 'Error interno al crear el usuario.' }, { status: 500 });
    }

    // 3. Crear el perfil en la tabla `profiles`
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.id,
        nombre: nombre,
        apellido: apellido,
        rol: rol,
      })
      .select()
      .single();

    if (profileError || !newProfile) {
        console.error('Error al crear el perfil:', profileError);
        // Si la creación del perfil falla, se debería idealmente eliminar el usuario recién creado.
        // Esta lógica de rollback puede ser compleja; por ahora, devolvemos un error.
        await supabaseAdmin.from('users').delete().eq('id', newUser.id);
        return NextResponse.json({ message: 'Error interno al crear el perfil de usuario.' }, { status: 500 });
    }

    // Se construye la respuesta con el estado 'activo' para la UI
    const responseData = { ...newProfile, email: email, activo: true };

    return NextResponse.json({ message: 'Usuario creado con éxito', user: responseData }, { status: 201 });

  } catch (error) {
    console.error('Error inesperado en la API de creación de usuarios:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
