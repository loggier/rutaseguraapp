import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Ruta, Estudiante, Parada, Colegio } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RouteOptimizationForm } from './route-optimization-form';

type RouteData = {
    route: Ruta & { colegio: Colegio };
    students: (Estudiante & { paradas: Parada[] })[];
}

async function getRouteDataForOptimization(routeId: string): Promise<RouteData | null> {
    const supabase = createClient();
    
    // 1. Fetch the route details including the school location and optimized routes
    const { data: routeData, error: routeError } = await supabase
        .from('rutas')
        .select(`*, colegio:colegios(*)`)
        .eq('id', routeId)
        .single();
        
    if (routeError || !routeData) {
        console.error("Error fetching route for optimization:", routeError);
        return null;
    }

    const route = {
      ...routeData,
      colegio: Array.isArray(routeData.colegio) ? routeData.colegio[0] : routeData.colegio,
    };
    if (!route.colegio) {
        console.error("Route is not associated with a school");
        return null;
    }


    // 2. Fetch the students assigned to this route
    const { data: assignedStopsData, error: assignedError } = await supabase
        .from('ruta_estudiantes')
        .select('estudiante_id')
        .eq('ruta_id', routeId);
        
    if (assignedError) {
        console.error("Error fetching assigned students:", assignedError);
        return null;
    }
    
    const assignedStudentIds = [...new Set(assignedStopsData.map(item => item.estudiante_id))];

    let students: (Estudiante & { paradas: Parada[] })[] = [];
    if (assignedStudentIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
            .from('estudiantes')
            .select('id, student_id, nombre, apellido, paradas!inner(*)')
            .in('id', assignedStudentIds)
            .eq('paradas.activo', true); // Only fetch active stops
        
        if (studentsError) {
            console.error("Error fetching student data with stops:", studentsError);
            return null;
        }
        students = studentsData as (Estudiante & { paradas: Parada[] })[];
    }
    
    return {
        route,
        students,
    };
}


export default async function OptimizeRoutePage({ params }: { params: { id: string } }) {
    const data = await getRouteDataForOptimization(params.id);

    if (!data) {
        notFound();
    }
    
    const { route, students } = data;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={`Optimizar Ruta: ${route.nombre}`}
                description={`Usa IA para encontrar el orden más eficiente de paradas y guarda el resultado.`}
            />
             <RouteOptimizationForm route={route} students={students} />
        </div>
    );
}
