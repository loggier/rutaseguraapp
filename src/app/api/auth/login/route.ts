'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

// This type is for internal use within this API route
type UserWithPassword = {
  id: string;
  password: string; // This is the hashed password from the DB
};

/**
 * Verifies the plaintext password against the stored hash using pgcrypto's crypt() function.
 * @param password - The plaintext password.
 * @param hash - The stored hash from the database.
 * @returns - True if the password is valid, false otherwise.
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // The admin client is created here to ensure access to env vars at runtime.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {}, // Use an empty cookies object to ensure the service role is used
      db: { schema: 'rutasegura' }
    }
  );

  const { data, error } = await supabase.rpc('verify_password', {
    password: password,
    hash: hash,
  });

  if (error) {
    console.error('Error verifying password with RPC:', error);
    return false;
  }
  return data;
}

export async function POST(request: Request) {
  // The admin client must be created within the function to ensure
  // environment variables are available in the serverless environment.
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {}, // Crucial: Use an empty cookies object to bypass user session and use service_role
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

    // 1. Find the user by email in the 'users' table
    const { data: user, error: userError }: PostgrestSingleResponse<UserWithPassword> = await supabaseAdmin
      .from('users')
      .select('id, password')
      .eq('email', email)
      .single();

    // For security, we don't differentiate between "user not found" and "wrong password".
    // We check for the user first, and if they exist, we check the password.
    if (userError || !user) {
      console.error('Login attempt for non-existent user or DB error:', email, userError);
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 2. Verify the password using the database function
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      console.error('Invalid password attempt for user:', email);
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 3. If the password is valid, get the user's full profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nombre, apellido, rol')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ message: 'No se pudo encontrar el perfil del usuario.' }, { status: 404 });
    }

    // 4. Combine information and prepare it for the session
    const sessionData = {
      id: user.id,
      email: email, // We already have the email from the request
      nombre: profile.nombre,
      apellido: profile.apellido,
      rol: profile.rol,
    };

    // TODO: In the future, this is where a JWT would be generated and signed
    // and set in an HttpOnly cookie.
    return NextResponse.json({ message: 'Inicio de sesión exitoso', user: sessionData }, { status: 200 });

  } catch (error) {
    console.error('Error in Login API:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
