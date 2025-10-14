'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifyPassword } from '@/lib/auth-utils';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

type UserData = {
  id: string;
  password: string;
  activo: boolean;
};

export async function POST(request: Request) {
  try {
    const { email, password, colegioId } = await request.json();

    if (!email || !password || !colegioId) {
      return NextResponse.json({ message: 'Colegio, correo electrónico y contraseña son requeridos.' }, { status: 400 });
    }
    
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { get: () => undefined, set: () => {}, remove: () => {} },
        db: { schema: 'rutasegura' },
      }
    );

    const { data: user, error: userError }: PostgrestSingleResponse<UserData> = await supabaseAdmin
      .from('users')
      .select('id, password, activo')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }
    
    if (!user.activo) {
        return NextResponse.json({ message: 'El usuario se encuentra inactivo.' }, { status: 403 });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nombre, apellido, rol, colegio_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ message: 'Error interno: no se pudo encontrar el perfil del usuario.' }, { status: 500 });
    }

    // For Master and Manager, colegio_id check is not needed
    // For 'padre' and 'colegio', they must belong to the selected colegio
    if (profile.rol === 'padre' && profile.colegio_id !== colegioId) {
        return NextResponse.json({ message: 'Este usuario no pertenece al colegio seleccionado.' }, { status: 403 });
    }
    
    if (profile.rol === 'colegio') {
         const { data: schoolData, error: schoolError } = await supabaseAdmin
            .from('colegios')
            .select('id')
            .eq('usuario_id', user.id)
            .single();
        if(schoolError || !schoolData || schoolData.id !== colegioId) {
             return NextResponse.json({ message: 'La cuenta de este colegio no coincide con la selección.' }, { status: 403 });
        }
    }

    const { data: colegioData } = await supabaseAdmin.from('colegios').select('nombre').eq('id', colegioId).single();

    const sessionData = {
      id: user.id,
      email: email,
      nombre: profile.nombre,
      apellido: profile.apellido,
      rol: profile.rol,
      activo: user.activo,
      colegio_id: profile.rol === 'master' || profile.rol === 'manager' ? null : colegioId,
      colegio_nombre: colegioData?.nombre || 'Administrador',
    };

    return NextResponse.json({ message: 'Inicio de sesión exitoso', user: sessionData }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado en la API de Login:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
