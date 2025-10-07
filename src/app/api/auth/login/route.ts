import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Use supabase-js for password verification, not @supabase/ssr
// We need a service role client to query the users table and use pg_crypto
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'rutasegura'
    }
  }
);

/**
 * Verifies the provided password against the stored hash using pg_crypto's crypt() function.
 * @param password The plain text password.
 * @param hash The stored password hash from the database.
 * @returns A boolean indicating if the password is valid.
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_password', {
    password,
    hash,
  });

  if (error) {
    console.error('Error verifying password:', error);
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

    // 1. Fetch user by email from the 'users' table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 2. Verify the password using the database function
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }
    
    // 3. Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
       return NextResponse.json({ message: 'No se pudo encontrar el perfil del usuario.' }, { status: 404 });
    }

    // On successful login, you would typically create a session (e.g., with JWT)
    // and return it as a cookie.
    // For now, we'll just return the user and profile data.
    const sessionData = {
        id: user.id,
        email: user.email,
        ...profile
    };

    return NextResponse.json({ message: 'Inicio de sesión exitoso', user: sessionData }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
