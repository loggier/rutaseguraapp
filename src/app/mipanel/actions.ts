'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Estudiante, Parada, TrackedBus, OptimizedRouteResult, Colegio, Incidencia } from '@/lib/types';


type ParentDashboardData = {
    hijos: (Estudiante & { paradas: Parada[], ruta_id?: string })[];
    buses: TrackedBus[];
    colegio: Colegio | null;
};

export async function getParentDashboardData(parentId: string): Promise<ParentDashboardData> {
    const supabase = createServerClient();

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
        return { hijos: [], buses: [], colegio: null };
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

    const rutaIds = [...new Set(childrenWithData.map(h => h.ruta_id).filter(Boolean))];

    if (rutaIds.length === 0) {
        return { hijos: childrenWithData, buses: [], colegio: colegioData };
    }

    // 5. Get all necessary buses and their related info from the view
    const { data: busesData, error: busesError } = await supabase
        .from('autobuses_view')
        .select('*')
        .in('ruta_id', rutaIds as string[]);

    if (busesError) {
        console.error("Error fetching buses from view:", busesError);
        return { hijos: childrenWithData, buses: busesData as TrackedBus[] || [], colegio: colegioData };
    }

    // 6. Fetch full route data for the buses
    const { data: routesData, error: routesError } = await supabase
        .from('rutas')
        .select('id, nombre, hora_salida_manana, hora_salida_tarde, colegio_id, creado_por, fecha_creacion, estudiantes_count, ruta_optimizada_recogida, ruta_optimizada_entrega, colegio:colegios!inner(id, nombre, lat, lng)')
        .in('id', rutaIds as string[]);

    if (routesError) {
        console.error("Error fetching routes:", routesError);
        return { hijos: childrenWithData, buses: busesData as TrackedBus[] || [], colegio: colegioData };
    }
    
    const routesMap = (routesData || []).reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
    }, {} as Record<string, any>);


    const finalBuses: TrackedBus[] = (busesData || []).map((bus: any) => {
        const fullRouteData = routesMap[bus.ruta_id];
        if (!fullRouteData) return null;

        return {
            id: bus.id,
            matricula: bus.matricula,
            conductor: { 
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
            },
            ruta: {
                ...fullRouteData,
                ruta_recogida: fullRouteData.ruta_optimizada_recogida,
                ruta_entrega: fullRouteData.ruta_optimizada_entrega,
            }
        };
    }).filter((bus): bus is TrackedBus => bus !== null && !!bus.ruta);


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
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('incidencias')
        .select(`
            *,
            estudiante:estudiantes ( nombre, apellido )
        `)
        .eq('padre_id', parentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching incidents:", error);
        return [];
    }

    return data as IncidenceWithStudent[];
}
