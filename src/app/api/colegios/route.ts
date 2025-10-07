'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth-utils';

const schoolSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  ruc: z.string().length(13, 'El RUC debe tener 13 caracteres'),
  email_contacto: z.string().email('Email de contacto inválido'),
  telefono: z.string().min(1, 'Teléfono requerido'),
  direccion: z.string().min(1, 'Dirección requerida'),
  codigo_postal: z.string().min(1, 'Código postal requerido'),
  email: z.string().email('Email de cuenta inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  creado_por: z.string().uuid('ID de creador inválido'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = schoolSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { 
        nombre, ruc, email_contacto, telefono, direccion, codigo_postal, 
        email, password, creado_por 
    } = validation.data;
    
    const hashedPassword = await hashPassword(password);
    
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { get: () => undefined, set: () => {}, remove: () => {} },
        db: { schema: 'rutasegura' },
      }
    );

    // 1. Verificar si el email o RUC ya existen
    const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', email).single();
    if (existingUser) {
        return NextResponse.json({ message: 'Ya existe un usuario con este correo electrónico.' }, { status: 409 });
    }
    const { data: existingSchool } = await supabaseAdmin.from('colegios').select('id').eq('ruc', ruc).single();
    if (existingSchool) {
        return NextResponse.json({ message: 'Ya existe un colegio con este RUC.' }, { status: 409 });
    }

    // --- Transacción ---
    // 2. Crear usuario
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({ email, password: hashedPassword, activo: true })
      .select('id')
      .single();

    if (userError || !newUser) {
      console.error('Error al crear usuario para colegio:', userError);
      return NextResponse.json({ message: 'Error al crear la cuenta de usuario: ' + userError?.message }, { status: 500 });
    }
    const newUserId = newUser.id;

    // 3. Crear perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: newUserId, rol: 'colegio', nombre, apellido: 'Colegio' });
    
    if (profileError) {
      console.error('Error al crear perfil para colegio:', profileError);
      await supabaseAdmin.from('users').delete().eq('id', newUserId); // Rollback
      return NextResponse.json({ message: 'Error al crear el perfil: ' + profileError.message }, { status: 500 });
    }

    // 4. Crear colegio, usando el ID del nuevo usuario
    const { data: newSchool, error: schoolError } = await supabaseAdmin
      .from('colegios')
      .insert({
        usuario_id: newUserId, // <-- CORRECCIÓN CLAVE
        nombre, 
        ruc, 
        email_contacto, 
        telefono, 
        direccion, 
        codigo_postal, 
        creado_por, 
        activo: true
      })
      .select(`
          id, nombre, ruc, email_contacto, telefono, direccion, codigo_postal, activo
      `)
      .single();

    if (schoolError || !newSchool) {
      console.error('Error al crear colegio:', schoolError);
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId); // Rollback
      await supabaseAdmin.from('users').delete().eq('id', newUserId); // Rollback
      return NextResponse.json({ message: 'Error al registrar los datos del colegio: ' + schoolError?.message }, { status: 500 });
    }

    const responseData = {
        ...newSchool,
        email: email
    };

    return NextResponse.json({ message: 'Colegio creado con éxito', colegio: responseData }, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado en API de creación de colegios:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
