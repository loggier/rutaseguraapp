import { notFound } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '@/lib/supabase/server';
import { EditStudentForm } from './edit-student-form';

// Función para obtener los datos del estudiante desde el servidor
async function getStudentData(studentId: string) {
    const supabase = createClient();
    const { data: student, error } = await supabase
        .from('estudiantes')
        .select(`
            *,
            padre:profiles(nombre, apellido, user:users(email)),
            colegio:colegios(nombre)
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
        colegio_nombre: student.colegio ? student.colegio.nombre : 'No asignado'
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
        description="Actualiza los datos personales del estudiante."
      />
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Formulario de Edición</CardTitle>
          <CardDescription>
            Solo se pueden modificar los campos de información personal. El padre/tutor y el colegio no son editables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditStudentForm student={student} />
        </CardContent>
      </Card>
    </div>
  );
}
