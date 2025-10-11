import { notFound } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '@/lib/supabase/server';
import { EditStudentForm } from './edit-student-form';
import { StopsManagement } from './stops-management';
import { Separator } from '@/components/ui/separator';

// Función para obtener los datos del estudiante desde el servidor
async function getStudentData(studentId: string) {
    const supabase = createClient();
    const { data: student, error } = await supabase
        .from('estudiantes')
        .select(`
            *,
            padre:profiles(nombre, apellido, user:users(email)),
            colegio:colegios(nombre),
            paradas:paradas(*)
        `)
        .eq('id', studentId)
        .single();
    
    if (error || !student) {
        console.error("Error fetching student:", error);
        return null;
    }

     const responseData = {
        ...student,
        padre_nombre: student.padre ? `${student.padre.nombre} ${student.padre.apellido}` : 'No asignado',
        padre_email: student.padre?.user ? student.padre.user.email : '-',
        colegio_nombre: student.colegio ? student.colegio.nombre : 'No asignado',
        paradas: student.paradas || [],
    };

    return responseData;
}


export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const student = await getStudentData(params.id);

  if (!student) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Editar Estudiante"
        description="Actualiza los datos personales y gestiona las paradas del estudiante."
      />
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Datos Personales</CardTitle>
          <CardDescription>
            Los campos de padre/tutor y colegio no son editables desde aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditStudentForm student={student} />
        </CardContent>

        <Separator className="my-6" />

        <CardHeader>
          <CardTitle>Gestión de Paradas</CardTitle>
          <CardDescription>
            Define la parada de Recogida y la de Entrega para el estudiante. Solo una puede estar activa.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <StopsManagement student={student} initialStops={student.paradas}/>
        </CardContent>
      </Card>
    </div>
  );
}
