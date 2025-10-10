'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const studentSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  apellido: z.string().min(1, "El apellido es requerido."),
  email: z.string().email("El email no es válido.").optional().nullable().or(z.literal('')),
  telefono: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  padre_id: z.string().uuid("ID de padre/tutor inválido."),
  creador_id: z.string().uuid("ID de creador inválido."),
  user_rol: z.enum(['master', 'manager', 'colegio', 'padre']),
});

export async function POST(request: Request) {
  console.log("🚀 ENDPOINT LLAMADO - Iniciando creación de estudiante...");
  
  try {
    // Verificar que podemos parsear el JSON
    let body;
    try {
      body = await request.json();
      console.log("📦 Datos recibidos:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      return NextResponse.json({ 
        message: 'Error en el formato JSON de la solicitud' 
      }, { status: 400 });
    }

    // Validación básica
    const validation = studentSchema.safeParse(body);
    if (!validation.success) {
      console.error("❌ Validación fallida:", validation.error.flatten());
      return NextResponse.json({ 
        message: "Datos inválidos.", 
        errors: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { nombre, apellido, email, telefono, avatar_url, padre_id, creador_id, user_rol } = validation.data;
    
    console.log("✅ Datos validados correctamente");
    console.log("👤 Estudiante:", `${nombre} ${apellido}`);
    console.log("👨‍👦 Padre ID:", padre_id);
    console.log("🎓 Creador ID:", creador_id);
    console.log("🔑 User Rol:", user_rol);

    // SIMULAR UNA RESPUESTA EXITOSA PRIMERO
    // Para verificar que el endpoint funciona
    return NextResponse.json({ 
      message: 'Endpoint funcionando - Simulación exitosa',
      data_received: {
        nombre,
        apellido,
        email,
        telefono,
        avatar_url,
        padre_id,
        creador_id,
        user_rol
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor: ' + error.message 
    }, { status: 500 });
  }
}
