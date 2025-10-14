'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Estudiante, Parada, TrackedBus, OptimizedRouteResult } from '@/lib/types';


type ParentDashboardData = {
    hijos: (Estudiante & { paradas: Parada[], ruta_id?: string })[];
    buses: TrackedBus[];
};

export async function getParentDashboardData(parentId: string): Promise<ParentDashboardData> {
    const supabase = createServerClient();

    // 1. Get children of the parent
    const { data: hijos, error: hijosError } = await supabase
        .from('estudiantes')
        .select(`id, student_id, nombre, apellido, avatar_url, colegio_id, activo, colegio:colegios(nombre)`)
        .eq('padre_id', parentId);

    if (hijosError) {
        console.error("Error fetching children:", hijosError);
        return { hijos: [], buses: [] };
    }
    if (!hijos) return { hijos: [], buses: [] };

    const hijosIds = hijos.map(h => h.id);
    if (hijosIds.length === 0) return { hijos: [], buses: [] };
    
    // 2. Get route assignments for all children in one go
    const { data: routeAssignments, error: assignmentsError } = await supabase
        .from('ruta_estudiantes')
        .select('estudiante_id, ruta_id')
        .in('estudiante_id', hijosIds);

    if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        // Continue, maybe some children don't have routes
    }

    const assignmentsMap = (routeAssignments || []).reduce((acc, assign) => {
        acc[assign.estudiante_id] = assign.ruta_id;
        return acc;
    }, {} as Record<string, string>);

    // 3. Get all active stops for all children
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
        return { hijos: childrenWithData, buses: [] };
    }

    // 4. Get all necessary buses and their related info
    const { data: busesData, error: busesError } = await supabase
        .from('autobuses_view')
        .select('*')
        .in('ruta_id', rutaIds as string[]);

    if (busesError) {
        console.error("Error fetching buses:", busesError);
        return { hijos: childrenWithData, buses: [] };
    }

    // 5. Fetch full route data for the buses
    const { data: routesData, error: routesError } = await supabase
        .from('rutas')
        .select('id, nombre, hora_salida_manana, hora_salida_tarde, colegio_id, creado_por, fecha_creacion, estudiantes_count, ruta_optimizada_recogida, ruta_optimizada_entrega, colegio:colegios!inner(id, nombre, lat, lng)')
        .in('id', rutaIds as string[]);

    if (routesError) {
        console.error("Error fetching routes:", routesError);
        return { hijos: childrenWithData, buses: busesData as TrackedBus[] || [] };
    }

    const routesMap = (routesData || []).reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
    }, {} as Record<string, any>);


    const finalBuses: TrackedBus[] = (busesData || []).map((bus: any) => ({
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
        ruta: routesMap[bus.ruta_id] ? {
            ...routesMap[bus.ruta_id],
            ruta_recogida: routesMap[bus.ruta_id].ruta_optimizada_recogida,
            ruta_entrega: routesMap[bus.ruta_id].ruta_optimizada_entrega,
        } : null
    })).filter((bus): bus is TrackedBus => !!bus.ruta);


    return {
        hijos: childrenWithData,
        buses: finalBuses,
    };
}
