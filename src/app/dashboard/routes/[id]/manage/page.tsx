

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Ruta, Estudiante, Parada } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ManageStudentsForm } from './manage-students-form';

type ManageStudentsData = {
    route: Ruta;
    assignedStudents: (Estudiante & { paradas: Parada[] })[];
}

async function getManageStudentsData(routeId: string): Promise<ManageStudentsData | null> {
    const supabase = createClient();
    
    // 1. Fetch the route details
    const { data: routeData, error: routeError } = await supabase
        .from('rutas')
        .select(`*, colegio:colegios(id, nombre)`)
        .eq('id', routeId)
        .single();
        
    if (routeError || !routeData) {
        console.error("Error fetching route:", routeError);
        return null;
    }

    // 2. Fetch the students already assigned to this route
    // We use a Set to get unique student IDs because a student might be assigned twice (once per stop type)
    const { data: assignedStopsData, error: assignedError } = await supabase
        .from('ruta_estudiantes')
        .select('estudiante_id')
        .eq('ruta_id', routeId);
        
    if (assignedError) {
        console.error("Error fetching assigned students:", assignedError);
        return null;
    }
    
    const assignedStudentIds = [...new Set(assignedStopsData.map(item => item.estudiante_id))];

    let assignedStudents: (Estudiante & { paradas: Parada[] })[] = [];
    if (assignedStudentIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
            .from('estudiantes')
            .select('*, paradas(*)')
            .in('id', assignedStudentIds);
        
        if (studentsError) {
            console.error("Error fetching full student data:", studentsError);
            return null;
        }
        assignedStudents = studentsData as (Estudiante & { paradas: Parada[] })[];
    }
    
    const formattedRoute = {
        ...routeData,
        estudiantes_count: assignedStudentIds.length,
        colegio: Array.isArray(routeData.colegio) ? routeData.colegio[0] : routeData.colegio,
    };

    return {
        route: formattedRoute,
        assignedStudents: assignedStudents,
    };
}


export default async function ManageRouteStudentsPage({ params }: { params: { id: string } }) {
    const data = await getManageStudentsData(params.id);

    if (!data) {
        notFound();
    }
    
    const { route, assignedStudents } = data;

    const turnos = [];
    if (route.hora_salida_manana) turnos.push('Recogida');
    if (route.hora_salida_tarde) turnos.push('Entrega');
    const turnosText = turnos.join(' y ');

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={`Gestionar Estudiantes: ${route.nombre}`}
                description={`Busca y asigna estudiantes del colegio ${route.colegio?.nombre} a esta ruta.`}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Asignación de Estudiantes</CardTitle>
                    <CardDescription>
                        Usa el buscador para añadir estudiantes. El sistema asignará su parada activa para los turnos de {turnosText}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ManageStudentsForm 
                        route={route} 
                        initialAssignedStudents={assignedStudents}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
