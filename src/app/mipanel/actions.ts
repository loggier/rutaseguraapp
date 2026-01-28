'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import type { Estudiante, Parada, TrackedBus, Colegio, Incidencia, Conductor, Ruta } from '@/lib/types';


type ParentDashboardData = {
    hijos: (Estudiante & { paradas: Parada[], ruta_id?: string })[];
    buses: TrackedBus[];
    colegio: Colegio | null;
};

export async function getParentDashboardData(parentId: string): Promise<ParentDashboardData> {
    noStore();
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { 
            cookies: { get: () => undefined, set: () => {}, remove: () => {} },
            db: { schema: 'rutasegura' },
        }
    );

    // 1. Get parent's children
    const { data: hijos, error: hijosError } = await supabaseAdmin
        .from('estudiantes')
        .select(`id, student_id, nombre, apellido, avatar_url, colegio_id, activo, padre_id, email, telefono, colegio:colegios(nombre)`)
        .eq('padre_id', parentId);

    if (hijosError || !hijos || hijos.length === 0) {
        console.error("Error fetching children or no children found:", hijosError);
        return { hijos: [], buses: [], colegio: null };
    }
    const hijosIds = hijos.map(h => h.id);

    // 2. Get school from the first child (assuming all have same school)
    const colegioId = hijos[0].colegio_id;
    const { data: colegioData, error: colegioError } = await supabaseAdmin
        .from('colegios')
        .select('*')
        .eq('id', colegioId)
        .single();
    if (colegioError) console.error("Error fetching school data:", colegioError);
    
    // 3. Get route assignments for all children
    const { data: routeAssignments, error: assignmentsError } = await supabaseAdmin
        .from('ruta_estudiantes')
        .select('estudiante_id, ruta_id')
        .in('estudiante_id', hijosIds);

    if (assignmentsError) console.error("Error fetching route assignments:", assignmentsError);
    
    const assignmentsMap = (routeAssignments || []).reduce((acc, assign) => {
        acc[assign.estudiante_id] = assign.ruta_id;
        return acc;
    }, {} as Record<string, string>);
    
    const childrenWithData = hijos.map((hijo: any) => ({
        ...hijo,
        ruta_id: assignmentsMap[hijo.id],
    }));

    // 4. Get all stops for all children (this can be done in parallel)
    const { data: paradas, error: paradasError } = await supabaseAdmin
        .from('paradas')
        .select('*')
        .in('estudiante_id', hijosIds);
    if (paradasError) console.error("Error fetching stops:", paradasError);
    const paradasMap = (paradas || []).reduce((acc, parada) => {
        if (!acc[parada.estudiante_id]) acc[parada.estudiante_id] = [];
        acc[parada.estudiante_id].push(parada as Parada);
        return acc;
    }, {} as Record<string, Parada[]>);

    const childrenWithFullData = childrenWithData.map(hijo => ({
        ...hijo,
        colegio_nombre: hijo.colegio?.nombre || 'No Asignado',
        paradas: paradasMap[hijo.id] || [],
    }));


    // 5. Get the unique set of route IDs the children are assigned to
    const uniqueRutaIds = [...new Set(Object.values(assignmentsMap).filter(Boolean))];

    if (uniqueRutaIds.length === 0) {
        return { hijos: childrenWithFullData, buses: [], colegio: colegioData || null };
    }
    
    // 6. Fetch buses assigned to these routes.
    const { data: busesData, error: busesError } = await supabaseAdmin
        .from('autobuses')
        .select(`
            *,
            conductor:conductores(*),
            ruta:rutas(*)
        `)
        .in('ruta_id', uniqueRutaIds);
        
    if (busesError) {
        console.error("Error fetching buses for routes:", busesError);
        return { hijos: childrenWithFullData, buses: [], colegio: colegioData || null };
    }

    // 7. Map the raw bus data to our TrackedBus type
    const finalBuses: TrackedBus[] = (busesData || []).map((bus: any) => ({
        id: bus.id,
        matricula: bus.matricula,
        last_valid_latitude: bus.last_valid_latitude,
        last_valid_longitude: bus.last_valid_longitude,
        conductor: bus.conductor as Conductor | null,
        ruta: bus.ruta as Ruta | null,
    }));

    return {
        hijos: childrenWithFullData,
        buses: finalBuses,
        colegio: colegioData || null,
    };
}


export type IncidenceWithStudent = Incidencia & {
    estudiante: {
        nombre: string;
        apellido: string;
    } | null;
}

export async function getParentIncidents(parentId: string): Promise<IncidenceWithStudent[]> {
     const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get: () => undefined, set: () => {}, remove: () => {} },
        db: { schema: 'rutasegura' },
        }
    );
    const { data, error } = await supabaseAdmin
        .from('incidencias')
        .select(`
            *,
            estudiante:estudiante_id!inner(nombre, apellido)
        `)
        .eq('padre_id', parentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching incidents with service key:", error);
        return [];
    }
    
    return data as IncidenceWithStudent[];
}
