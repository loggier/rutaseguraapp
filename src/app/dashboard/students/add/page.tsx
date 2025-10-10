
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStudentForm } from "./add-student-form";
import { getParentsForSchool } from "@/lib/services/student-services";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/contexts/user-context";

async function getSessionUser(): Promise<User | null> {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('rutasegura_user');
    if(userCookie) {
        try {
            // The value is URL-encoded, so we need to decode it first.
            const decodedValue = decodeURIComponent(userCookie.value);
            return JSON.parse(decodedValue) as User;
        } catch (e) {
            console.error("Failed to parse user cookie:", e);
            return null;
        }
    }
    return null;
}


export default async function AddStudentPage() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect('/');
  }

  const parents = await getParentsForSchool(user.id, user.rol);
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agregar Nuevo Estudiante"
        description="Completa los datos del estudiante y asigna un padre/tutor."
      />
      <Card className="max-w-4xl mx-auto w-full">
          <CardHeader>
              <CardTitle>Formulario de Registro</CardTitle>
              <CardDescription>Los campos marcados con * son obligatorios.</CardDescription>
          </CardHeader>
          <CardContent>
              <AddStudentForm parents={parents} user={user} />
          </CardContent>
      </Card>
    </div>
  );
}
