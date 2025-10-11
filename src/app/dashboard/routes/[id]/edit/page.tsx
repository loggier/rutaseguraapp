'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Colegio, Ruta } from "@/lib/types";
import { EditRouteForm } from "./edit-route-form";
import { notFound } from 'next/navigation';

export default function EditRoutePage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const router = useRouter();
  const [route, setRoute] = useState<Ruta | null>(null);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
     if (user.rol !== 'master' && user.rol !== 'manager' && user.rol !== 'colegio') {
      router.replace('/dashboard');
      return;
    }
    
    async function fetchData() {
        const supabase = createClient();
        
        // Fetch the route data
        const { data: routeData, error: routeError } = await supabase
            .from('rutas')
            .select(`*, colegio:colegios(id, nombre)`)
            .eq('id', params.id)
            .single();

        if (routeError || !routeData) {
            console.error("Error fetching route:", routeError);
            setLoading(false);
            return;
        }
        
        const formattedRoute = {
          ...routeData,
          colegio: Array.isArray(routeData.colegio) ? routeData.colegio[0] : routeData.colegio,
        };
        setRoute(formattedRoute);

        // Fetch colegios if user is admin
        if (user?.rol === 'master' || user?.rol === 'manager') {
            const { data: colegiosData, error: colegiosError } = await supabase.from('colegios_view').select('*').order('nombre');
            if (colegiosError) {
                console.error("Error fetching colegios:", colegiosError);
            } else {
                setColegios(colegiosData || []);
            }
        }
        setLoading(false);
    }
    
    fetchData();

  }, [user, router, params.id]);

  if (loading || !user) {
     return (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  if (!route) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Editar Ruta: ${route.nombre}`}
        description="Actualiza los detalles de la ruta."
      />
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Formulario de Ruta</CardTitle>
          <CardDescription>Realiza los cambios necesarios y guarda.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditRouteForm user={user} colegios={colegios} route={route} />
        </CardContent>
      </Card>
    </div>
  );
}
