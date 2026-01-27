
'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/server';
import type { Estudiante, Parada, TrackedBus, Colegio, Incidencia, Conductor, Ruta } from '@/lib/types';


type ParentDashboardData = {
    hijos: (Estudiante & { paradas: Parada[], ruta_id?: string })[];
    buses: TrackedBus[];
    colegio: Colegio | null;
};

export async function getParentDashboardData(parentId: string): Promise<ParentDashboardData> {
    const supabase = createClient();

    // 1. Get parent's profile to find their colegio_id
    const { data: parentProfile, error: parentProfileError } = await supabase
        .from('profiles')
        .select('colegio_id')
        .eq('id', parentId)
        .single();
    
    if (parentProfileError || !parentProfile?.colegio_id) {
        console.error("Error fetching parent profile or parent has no school:", parentProfileError);
        return { hijos: [], buses: [], colegio: null };
    }
    const colegioId = parentProfile.colegio_id;

    // 2. Get the parent's school details
    const { data: colegioData, error: colegioError } = await supabase
        .from('colegios')
        .select('*')
        .eq('id', colegioId)
        .single();
    
    if (colegioError) {
        console.error("Error fetching school data:", colegioError);
    }

    // 3. Get children of the parent
    const { data: hijos, error: hijosError } = await supabase
        .from('estudiantes')
        .select(`id, student_id, nombre, apellido, avatar_url, colegio_id, activo, padre_id, email, telefono, colegio:colegios(nombre)`)
        .eq('padre_id', parentId);

    if (hijosError || !hijos || hijos.length === 0) {
        console.error("Error fetching children or no children found:", hijosError);
        return { hijos: [], buses: [], colegio: colegioData };
    }

    const hijosIds = hijos.map(h => h.id);

    // 4. Get route assignments for all children
    const { data: routeAssignments, error: assignmentsError } = await supabase
        .from('ruta_estudiantes')
        .select('estudiante_id, ruta_id')
        .in('estudiante_id', hijosIds);

    if (assignmentsError) {
        console.error("Error fetching route assignments:", assignmentsError);
    }
    const assignmentsMap = (routeAssignments || []).reduce((acc, assign) => {
        acc[assign.estudiante_id] = assign.ruta_id;
        return acc;
    }, {} as Record<string, string>);

    // 5. Get all stops for all children
    const { data: paradas, error: paradasError } = await supabase
        .from('paradas')
        .select('*')
        .in('estudiante_id', hijosIds);
    
    if (paradasError) {
        console.error("Error fetching stops:", paradasError);
    }
    const paradasMap = (paradas || []).reduce((acc, parada) => {
        if (!acc[parada.estudiante_id]) {
            acc[parada.estudiante_id] = [];
        }
        acc[parada.estudiante_id].push(parada as Parada);
        return acc;
    }, {} as Record<string, Parada[]>);

    // 6. Assemble the full child data object
    const childrenWithData = hijos.map((hijo: any) => ({
        ...hijo,
        colegio_nombre: hijo.colegio?.nombre || 'No Asignado',
        ruta_id: assignmentsMap[hijo.id],
        paradas: paradasMap[hijo.id] || [],
    }));

    // 7. Get the unique set of route IDs the children are assigned to
    const uniqueRutaIds = [...new Set(Object.values(assignmentsMap).filter(Boolean))];

    // If no children are on any routes, return early with no buses.
    if (uniqueRutaIds.length === 0) {
        return { hijos: childrenWithData, buses: [], colegio: colegioData };
    }
    
    // 8. Fetch buses assigned to these routes, including their driver and full route details
    const { data: busesData, error: busesError } = await supabase
        .from('autobuses')
        .select(`
            *,
            conductor:conductores(*),
            ruta:rutas!inner(*, colegio:colegios!inner(id, nombre, lat, lng))
        `)
        .in('ruta_id', uniqueRutaIds);

    if (busesError) {
        console.error("Error fetching buses for routes:", busesError);
        return { hijos: childrenWithData, buses: [], colegio: colegioData };
    }

    // 9. Map the raw bus data to our TrackedBus type
    const finalBuses: TrackedBus[] = (busesData || []).map((bus: any) => ({
        id: bus.id,
        matricula: bus.matricula,
        last_valid_latitude: bus.last_valid_latitude,
        last_valid_longitude: bus.last_valid_longitude,
        conductor: bus.conductor as Conductor | null,
        ruta: bus.ruta as Ruta | null,
    }));

    return {
        hijos: childrenWithData,
        buses: finalBuses,
        colegio: colegioData,
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
