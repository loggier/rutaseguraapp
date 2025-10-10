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

// Helper to create a Supabase admin client
const createSupabaseAdminClient = () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { get: () => undefined, set: () => {}, remove: () => {} },
            db: { schema: 'rutasegura' },
        }
    );
};

// Function to generate the next auto-incrementing student ID
async function generateNextStudentId(client: ReturnType<typeof createSupabaseAdminClient>): Promise<string> {
    try {
        console.log("🔍 Buscando último student_id...");
        
        const { data, error } = await client
            .from('estudiantes')
            .select('student_id')
            .order('student_id', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error("❌ Error fetching last student ID:", error);
            throw error;
        }
        
        let nextId = 1;
        if (data?.student_id) {
            const lastId = parseInt(data.student_id, 10);
            if (!isNaN(lastId)) {
                nextId = lastId + 1;
            }
        }
        
        const newStudentId = nextId.toString().padStart(6, '0');
        console.log("✅ Nuevo student_id generado:", newStudentId);
        return newStudentId;
    } catch (error) {
        console.error("❌ Error en generateNextStudentId:", error);
        throw error;
    }
}

export async function POST(request: Request) {
  console.log("🚀 Iniciando creación de estudiante...");
  
  try {
    const body = await request.json();
    console.log("📦 Datos recibidos:", body);
    
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      console.error("❌ Validación fallida:", validation.error.flatten());
      return NextResponse.json({ 
        message: "Datos inválidos.", 
        errors: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { nombre, apellido, email, telefono, avatar_url, padre_id, creador_id, user_rol } = validation.data;
    const supabaseAdmin = createSupabaseAdminClient();

    console.log("🔍 Obteniendo colegio_id desde el padre...");
    console.log("👨‍👦 padre_id:", padre_id);

    // SIEMPRE obtener el colegio_id desde el padre seleccionado
    let colegio_id: string;

    // Buscar el colegio_id del padre en la tabla profiles
    const { data: padreData, error: padreError } = await supabaseAdmin
      .from('profiles')
      .select('colegio_id, nombre, apellido')
      .eq('id', padre_id)
      .single();

    if (padreError || !padreData) {
      console.error("❌ Error buscando datos del padre:", padreError);
      return NextResponse.json({ 
        message: 'No se pudo encontrar el padre/tutor seleccionado.' 
      }, { status: 404 });
    }

    if (!padreData.colegio_id) {
      console.error("❌ El padre no tiene colegio asignado");
      return NextResponse.json({ 
        message: 'El padre/tutor seleccionado no está asignado a ningún colegio.' 
      }, { status: 400 });
    }

    colegio_id = padreData.colegio_id;
    console.log("✅ colegio_id obtenido desde el padre:", colegio_id);
    console.log("👤 Padre:", `${padreData.nombre} ${padreData.apellido}`);

    // 2. Generate the next student ID
    console.log("🔢 Generando student_id...");
    const student_id = await generateNextStudentId(supabaseAdmin);

    // 3. Create the student record
    console.log("📝 Insertando estudiante...");
    console.log("📋 Datos a insertar:", {
      nombre,
      apellido,
      email,
      telefono,
      avatar_url,
      padre_id,
      colegio_id,
      student_id,
      creado_por: creador_id,
    });

    const { data: newStudent, error: studentError } = await supabaseAdmin
      .from('estudiantes')
      .insert({
        nombre,
        apellido,
        email,
        telefono,
        avatar_url,
        padre_id,
        colegio_id,
        student_id,
        creado_por: creador_id,
      })
      .select()
      .single();

    if (studentError) {
      console.error('❌ Error al crear estudiante:', studentError);
      console.error('🔍 Detalles del error:', {
        code: studentError.code,
        details: studentError.details,
        hint: studentError.hint,
        message: studentError.message
      });
      
      return NextResponse.json({ 
        message: 'Error al crear el estudiante: ' + studentError.message 
      }, { status: 500 });
    }

    if (!newStudent) {
      console.error('❌ No se retornó el estudiante creado');
      return NextResponse.json({ 
        message: 'Error interno: No se pudo recuperar el estudiante creado.' 
      }, { status: 500 });
    }

    console.log("✅ Estudiante creado exitosamente:", newStudent);

    // 4. Obtener datos relacionados para la respuesta
    console.log("🔍 Obteniendo datos relacionados...");
    const { data: studentWithRelations, error: relationsError } = await supabaseAdmin
      .from('estudiantes')
      .select(`
        *,
        padre:profiles(nombre, apellido, email),
        colegio:colegios(nombre)
      `)
      .eq('id', newStudent.id)
      .single();

    if (relationsError) {
      console.error("⚠️ Error obteniendo relaciones:", relationsError);
      // No fallar aquí, solo enviar los datos básicos
    }

    const responseData = {
        ...(studentWithRelations || newStudent),
        padre_nombre: studentWithRelations?.padre ? 
          `${studentWithRelations.padre.nombre} ${studentWithRelations.padre.apellido}` : 'No asignado',
        padre_email: studentWithRelations?.padre ? studentWithRelations.padre.email : '-',
        colegio_nombre: studentWithRelations?.colegio ? studentWithRelations.colegio.nombre : 'No asignado'
    };

    console.log("🎉 Proceso completado exitosamente");
    return NextResponse.json({ 
      message: 'Estudiante creado con éxito', 
      student: responseData 
    }, { status: 201 });

  } catch (error: any) {
    console.error('💥 Error inesperado en la API de creación de estudiantes:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor: ' + error.message 
    }, { status: 500 });
  }
}
