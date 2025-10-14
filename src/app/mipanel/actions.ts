'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Estudiante, Parada, TrackedBus } from '@/lib/types';


type ParentDashboardData = {
    hijos: (Estudiante & { paradas: Parada[], ruta_id?: string })[];
    buses: TrackedBus[];
};

export async function getParentDashboardData(parentId: string): Promise<ParentDashboardData> {
    const supabase = createServerClient();

    // 1. Get children of the parent
    const { data: hijos, error: hijosError } = await supabase
        .from('estudiantes')
        .select('id, student_id, nombre, apellido, avatar_url, colegio_id, activo')
        .eq('padre_id', parentId);

    if (hijosError) {
        console.error("Error fetching children:", hijosError);
        return { hijos: [], buses: [] };
    }

    const hijosIds = hijos.map(h => h.id);
    if (hijosIds.length === 0) {
        return { hijos: [], buses: [] };
    }

    // 2. Get route assignments and active stops for all children at once
    const { data: routeAssignments, error: assignmentsError } = await supabase
        .from('ruta_estudiantes')
        .select('estudiante_id, ruta_id, parada:paradas(*)')
        .in('estudiante_id', hijosIds);

    if (assignmentsError) {
        console.error("Error fetching route assignments:", assignmentsError);
        return { hijos: [], buses: [] };
    }
    
    // Group assignments by student
    const assignmentsByStudent = (routeAssignments || []).reduce((acc, current) => {
        if (!acc[current.estudiante_id]) {
            acc[current.estudiante_id] = { ruta_id: current.ruta_id, paradas: [] };
        }
        if (current.parada) {
            acc[current.estudiante_id].paradas.push(current.parada as Parada);
        }
        return acc;
    }, {} as Record<string, { ruta_id: string; paradas: Parada[] }>);

    const childrenWithRoutes = hijos.map(hijo => ({
        ...hijo,
        ruta_id: assignmentsByStudent[hijo.id]?.ruta_id,
        paradas: assignmentsByStudent[hijo.id]?.paradas || [],
    }));

    const rutaIds = [...new Set(childrenWithRoutes.map(h => h.ruta_id).filter(Boolean))];

    if (rutaIds.length === 0) {
        return { hijos: childrenWithRoutes, buses: [] };
    }

    // 3. Get all necessary buses and their related info in one go
    const { data: busesData, error: busesError } = await supabase
        .from('v_autobuses_rel')
        .select('*')
        .in('ruta->>id', rutaIds as string[]);

    if (busesError) {
        console.error("Error fetching buses from view:", busesError);
        return { hijos: childrenWithRoutes, buses: [] };
    }

    return {
        hijos: childrenWithRoutes,
        buses: busesData || [],
    };
}
