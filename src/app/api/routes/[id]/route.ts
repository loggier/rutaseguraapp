
'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

// --- DELETE para eliminar una ruta ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const routeId = params.id;

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Eliminar todas las asignaciones de estudiantes para esta ruta en la tabla 'ruta_estudiantes'
    const { error: deleteStudentsError } = await supabaseAdmin
        .from('ruta_estudiantes')
        .delete()
        .eq('ruta_id', routeId);
    
    if (deleteStudentsError) {
        console.error('Error al eliminar estudiantes de la ruta:', deleteStudentsError);
        return NextResponse.json({ message: 'Error interno al desasignar estudiantes de la ruta: ' + deleteStudentsError.message }, { status: 500 });
    }

    // 2. Eliminar la ruta de la tabla 'rutas'
    const { error: deleteRouteError } = await supabaseAdmin
      .from('rutas')
      .delete()
      .eq('id', routeId);

    if (deleteRouteError) {
        console.error('Error al eliminar la ruta:', deleteRouteError);
        return NextResponse.json({ message: 'Error interno al eliminar la ruta: ' + deleteRouteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Ruta eliminada con éxito.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en DELETE /api/routes/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
