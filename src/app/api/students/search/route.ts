
'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const colegioId = searchParams.get('colegioId');
  const studentId = searchParams.get('id');
  
  if (!query && !studentId) {
    return NextResponse.json({ message: "Se requiere un término de búsqueda ('query') o un ID de estudiante ('id')." }, { status: 400 });
  }

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { get: () => undefined, set: () => {}, remove: () => {} },
      db: { schema: 'rutasegura' },
    }
  );

  try {
    if (studentId) {
      const { data, error } = await supabaseAdmin
        .from('estudiantes')
        .select('*, paradas(*)')
        .eq('id', studentId);
      
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (query) {
      if (!colegioId) {
        return NextResponse.json({ message: "Se requiere 'colegioId' para la búsqueda." }, { status: 400 });
      }

      // We use `ilike` for case-insensitive search and `%` as a wildcard.
      const searchTerm = `%${query}%`;
      const { data, error } = await supabaseAdmin
        .from('estudiantes')
        .select('id, nombre, apellido, student_id')
        .eq('colegio_id', colegioId)
        .eq('activo', true)
        .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm},student_id.ilike.${searchTerm}`)
        .limit(10);
      
      if (error) throw error;
      return NextResponse.json(data);
    }
    
    // This part should not be reached if validation is correct
    return NextResponse.json([]);

  } catch (error: any) {
    console.error('Error searching students:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
