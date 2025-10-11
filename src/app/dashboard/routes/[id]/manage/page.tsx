
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Ruta, Estudiante, Parada, RutaEstudiante } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ManageStudentsForm } from './manage-students-form';

type ManageStudentsData = {
    route: Ruta;
    allStudents: (Estudiante & { paradas: Parada[] })[];
    assignedStudentIds: string[];
}

async function getManageStudentsData(routeId: string): Promise<ManageStudentsData | null> {
    const supabase = createClient();
    
    // 1. Fetch the route details
    const { data: routeData, error: routeError } = await supabase
        .from('rutas')
        .select(`*, colegio:colegios(nombre)`)
        .eq('id', routeId)
        .single();
        
    if (routeError || !routeData) {
        console.error("Error fetching route:", routeError);
        return null;
    }

    // 2. Fetch all students belonging to the same school as the route
    const { data: allStudentsData, error: studentsError } = await supabase
        .from('estudiantes')
        .select('*, paradas(*)')
        .eq('colegio_id', routeData.colegio_id)
        .eq('activo', true) // Only active students
        .order('apellido', { ascending: true });

    if (studentsError) {
        console.error("Error fetching students:", studentsError);
        return null;
    }

    // 3. Fetch the students already assigned to this route
    const { data: assignedStudentsData, error: assignedError } = await supabase
        .from('ruta_estudiantes')
        .select('estudiante_id')
        .eq('ruta_id', routeId);
        
    if (assignedError) {
        console.error("Error fetching assigned students:", assignedError);
        return null;
    }

    const assignedStudentIds = assignedStudentsData.map(item => item.estudiante_id);
    
    const formattedRoute = {
        ...routeData,
        estudiantes_count: assignedStudentIds.length,
        colegio: Array.isArray(routeData.colegio) ? routeData.colegio[0] : routeData.colegio,
    };

    return {
        route: formattedRoute,
        allStudents: allStudentsData || [],
        assignedStudentIds,
    };
}


export default async function ManageRouteStudentsPage({ params }: { params: { id: string } }) {
    const data = await getManageStudentsData(params.id);

    if (!data) {
        notFound();
    }
    
    const { route, allStudents, assignedStudentIds } = data;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={`Gestionar Estudiantes: ${route.nombre}`}
                description={`Asigna o desasigna estudiantes del colegio ${route.colegio?.nombre} para esta ruta.`}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Estudiantes</CardTitle>
                    <CardDescription>
                        Selecciona los estudiantes que formarán parte de esta ruta. El sistema asignará automáticamente su parada activa ({route.turno}).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ManageStudentsForm 
                        route={route} 
                        allStudents={allStudents} 
                        assignedStudentIds={assignedStudentIds} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}

