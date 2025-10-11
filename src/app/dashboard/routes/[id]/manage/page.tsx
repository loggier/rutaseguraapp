
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
    const { data: assignedStudentsData, error: assignedError } = await supabase
        .from('ruta_estudiantes')
        .select('estudiante:estudiantes(*, paradas(*))')
        .eq('ruta_id', routeId);
        
    if (assignedError) {
        console.error("Error fetching assigned students:", assignedError);
        return null;
    }

    const assignedStudents = assignedStudentsData
        .map(item => item.estudiante)
        .filter(Boolean) as (Estudiante & { paradas: Parada[] })[];
    
    const formattedRoute = {
        ...routeData,
        estudiantes_count: assignedStudents.length,
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
                        Utiliza el buscador para añadir estudiantes. El sistema asignará su parada activa ({route.turno}).
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

