import { notFound } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '@/lib/supabase/server';
import { EditSchoolForm } from './edit-school-form';
import type { Colegio } from '@/lib/types';

async function getSchoolData(schoolId: string): Promise<Colegio | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('colegios_view')
        .select('*')
        .eq('id', schoolId)
        .single();
    
    if (error || !data) {
        console.error("Error fetching school:", error);
        return null;
    }

    return data as Colegio;
}


export default async function EditSchoolPage({ params }: { params: { id: string } }) {
  const school = await getSchoolData(params.id);

  if (!school) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Editar Colegio"
        description="Actualiza los datos del colegio. El email de la cuenta no puede ser modificado."
      />
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Información del Colegio</CardTitle>
          <CardDescription>
            Realiza los cambios necesarios y guárdalos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditSchoolForm school={school} />
        </CardContent>
      </Card>
    </div>
  );
}
