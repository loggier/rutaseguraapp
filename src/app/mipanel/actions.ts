
'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/server';
import type { Estudiante, Parada, TrackedBus, OptimizedRouteResult, Colegio, Incidencia } from '@/lib/types';


type ParentDashboardData = {
    hijos: (Estudiante & { paradas: Parada[], ruta_id?: string })[];
    buses: TrackedBus[];
    colegio: Colegio | null;
};

export async function getParentDashboardData(parentId: string): Promise<ParentDashboardData> {
    const supabase = createClient();

    // 0. Get parent's profile to find their colegio_id
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

    // 1. Get the parent's school details
    const { data: colegioData, error: colegioError } = await supabase
        .from('colegios')
        .select('*')
        .eq('id', colegioId)
        .single();
    
    if (colegioError) {
        console.error("Error fetching school data:", colegioError);
    }


    // 2. Get children of the parent
    const { data: hijos, error: hijosError } = await supabase
        .from('estudiantes')
        .select(`id, student_id, nombre, apellido, avatar_url, colegio_id, activo, padre_id, email, telefono, colegio:colegios(nombre)`)
        .eq('padre_id', parentId);

    if (hijosError) {
        console.error("Error fetching children:", hijosError);
        return { hijos: [], buses: [], colegio: colegioData };
    }
    if (!hijos) return { hijos: [], buses: [], colegio: colegioData };

    const hijosIds = hijos.map(h => h.id);
    if (hijosIds.length === 0) return { hijos: [], buses: [], colegio: colegioData };
    
    // 3. Get route assignments for all children in one go
    const { data: routeAssignments, error: assignmentsError } = await supabase
        .from('ruta_estudiantes')
        .select('estudiante_id, ruta_id')
        .in('estudiante_id', hijosIds);

    if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
    }

    const assignmentsMap = (routeAssignments || []).reduce((acc, assign) => {
        acc[assign.estudiante_id] = assign.ruta_id;
        return acc;
    }, {} as Record<string, string>);

    // 4. Get all active stops for all children
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

    
    const childrenWithData = hijos.map((hijo: any) => ({
        ...hijo,
        colegio_nombre: hijo.colegio?.nombre || 'No Asignado',
        ruta_id: assignmentsMap[hijo.id],
        paradas: paradasMap[hijo.id] || [],
    }));

    // Get all unique route IDs assigned to the children
    const allAssignedRutaIds = [...new Set(Object.values(assignmentsMap).filter(Boolean))];

    if (allAssignedRutaIds.length === 0) {
        return { hijos: childrenWithData, buses: [], colegio: colegioData };
    }

    // 5. Fetch buses that are assigned to these specific routes
    const { data: busesData, error: busesError } = await supabase
        .from('autobuses_view')
        .select('*')
        .in('ruta_id', allAssignedRutaIds);

    if (busesError) {
        console.error("Error fetching buses for routes:", busesError);
        return { hijos: childrenWithData, buses: [], colegio: colegioData };
    }
    
    if (!busesData || busesData.length === 0) {
        return { hijos: childrenWithData, buses: [], colegio: colegioData };
    }
    
    // 6. Fetch full route data for the buses (using the same route IDs)
    const { data: routesData, error: routesError } = await supabase
        .from('rutas')
        .select('id, nombre, hora_salida_manana, hora_salida_tarde, colegio_id, creado_por, fecha_creacion, estudiantes_count, ruta_optimizada_recogida, ruta_optimizada_entrega, colegio:colegios!inner(id, nombre, lat, lng)')
        .in('id', allAssignedRutaIds);

    if (routesError) {
        console.error("Error fetching routes:", routesError);
        return { hijos: childrenWithData, buses: [], colegio: colegioData };
    }
    
    const routesMap = (routesData || []).reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
    }, {} as Record<string, any>);


    const finalBuses: TrackedBus[] = (busesData || []).map((bus: any) => {
        const fullRouteData = bus.ruta_id ? routesMap[bus.ruta_id] : null;

        return {
            id: bus.id,
            matricula: bus.matricula,
            last_valid_latitude: bus.last_valid_latitude,
            last_valid_longitude: bus.last_valid_longitude,
            conductor: bus.conductor_id ? { 
                id: bus.conductor_id,
                nombre: bus.conductor_nombre,
                apellido: '',
                licencia: '',
                telefono: null,
                activo: true,
                avatar_url: null,
                colegio_id: bus.colegio_id,
                creado_por: '',
                fecha_creacion: ''
            } : null,
            ruta: fullRouteData ? {
                ...fullRouteData,
                ruta_recogida: fullRouteData.ruta_optimizada_recogida,
                ruta_entrega: fullRouteData.ruta_optimizada_entrega,
            } : null
        };
    }).filter((bus): bus is TrackedBus => bus !== null);


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
