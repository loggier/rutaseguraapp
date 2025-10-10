'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStudentForm } from "./add-student-form";
import { getParentsForSchool } from "@/lib/services/student-services";
import type { Profile } from "@/lib/types";
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddStudentPage() {
  const { user } = useUser();
  const router = useRouter();
  const [parents, setParents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // The main layout should handle the redirection if the user is not logged in.
      // This is a safeguard.
      return;
    }

    async function loadParents() {
      try {
        const parentData = await getParentsForSchool(user!.id, user!.rol);
        setParents(parentData);
      } catch (error) {
        console.error("Failed to load parents", error);
        // Handle error, maybe show a toast
      } finally {
        setLoading(false);
      }
    }

    loadParents();
  }, [user, router]);

  if (loading) {
     return (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando datos...</p>
        </div>
    );
  }
  
  // user is guaranteed to be present here due to the layout's protection
  if (!user) return null;

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
