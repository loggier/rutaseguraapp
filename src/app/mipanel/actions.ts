

'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import type { Estudiante, Parada, TrackedBus, Colegio, Incidencia, Conductor, Ruta, Notificacion } from '@/lib/types';


type ParentDashboardData = {
    hijos: (Estudiante & { paradas: Parada[], ruta_id?: string, despacho_estado?: string, despacho_turno?: 'Recogida' | 'Entrega' })[];
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
    
    const uniqueRutaIds = [...new Set(Object.values(assignmentsMap).filter(Boolean))];

    // 4. Get dispatch status and turno for children if there are active routes
    let dispatchStatusMap: Record<string, string> = {};
    let rutaIdToTurnoMap: Record<string, 'Recogida' | 'Entrega'> = {};

    if (uniqueRutaIds.length > 0) {
        const { data: activeDespachos, error: despachosError } = await supabaseAdmin
            .from('despachos')
            .select('id, ruta_id, turno')
            .in('ruta_id', uniqueRutaIds)
            .in('estado', ['programado', 'en_curso']);
        
        if (despachosError) console.error("Error fetching active despachos:", despachosError);

        if (activeDespachos && activeDespachos.length > 0) {
            const activeDespachoIds = activeDespachos.map(d => d.id);

            rutaIdToTurnoMap = activeDespachos.reduce((acc, d) => {
                acc[d.ruta_id] = d.turno;
                return acc;
            }, {} as Record<string, 'Recogida' | 'Entrega'>);

            const { data: despachoParadas, error: paradasError } = await supabaseAdmin
                .from('despacho_paradas')
                .select('estudiante_id, estado')
                .in('despacho_id', activeDespachoIds)
                .in('estudiante_id', hijosIds);
            
            if (paradasError) console.error("Error fetching despacho paradas:", paradasError);
            
            if (despachoParadas) {
                dispatchStatusMap = despachoParadas.reduce((acc, parada) => {
                    acc[parada.estudiante_id] = parada.estado;
                    return acc;
                }, {} as Record<string, string>);
            }
        }
    }
    
    // 5. Get all stops for all children
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

    // 6. Combine all data
    const childrenWithFullData = hijos.map((hijo: any) => {
        const rutaId = assignmentsMap[hijo.id];
        return {
            ...hijo,
            ruta_id: rutaId,
            colegio_nombre: hijo.colegio?.nombre || 'No Asignado',
            paradas: paradasMap[hijo.id] || [],
            despacho_estado: dispatchStatusMap[hijo.id] || undefined,
            despacho_turno: rutaId ? rutaIdToTurnoMap[rutaId] : undefined,
        };
    });


    // 7. Get buses assigned to these routes if any are active.
    if (uniqueRutaIds.length === 0) {
        return { hijos: childrenWithFullData, buses: [], colegio: colegioData || null };
    }
    
    const { data: busesData, error: busesError } = await supabaseAdmin
        .from('autobuses')
        .select(`
            *,
            conductor:conductores(*),
            ruta:rutas!inner(*)
        `)
        .in('ruta_id', uniqueRutaIds);
        
    if (busesError) {
        console.error("Error fetching buses for routes:", busesError);
        return { hijos: childrenWithFullData, buses: [], colegio: colegioData || null };
    }

    const finalBuses: TrackedBus[] = (busesData || []).map((bus: any) => ({
        id: bus.id,
        matricula: bus.matricula,
        last_latitude: bus.last_latitude,
        last_longitude: bus.last_longitude,
        last_speed: bus.last_speed,
        conductor: bus.conductor as Conductor | null,
        ruta: bus.ruta as Ruta | null,
        imei_gps: bus.imei_gps,
        modelo_camara: bus.modelo_camara,
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

export async function getParentNotifications(userId: string): Promise<Notificacion[]> {
    noStore();
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { 
            cookies: { get: () => undefined, set: () => {}, remove: () => {} },
            db: { schema: 'rutasegura' },
        }
    );
    const { data, error } = await supabaseAdmin
        .from('notificaciones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 notifications

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }

    return data;
}
