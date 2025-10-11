
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddRouteForm } from "./add-route-form";
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from "react";

export default function AddRoutePage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      return;
    }
     if (user.rol !== 'master' && user.rol !== 'manager' && user.rol !== 'colegio') {
      router.replace('/dashboard');
    }
  }, [user, router]);


  if (!user) {
     return (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Crear Nueva Ruta"
        description="Completa los datos para registrar una nueva ruta para tu colegio."
      />
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Formulario de Ruta</CardTitle>
          <CardDescription>Los campos marcados con * son obligatorios.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddRouteForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
