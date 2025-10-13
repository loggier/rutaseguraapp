'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddBusForm } from "./add-bus-form";
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Colegio, Conductor, Ruta } from "@/lib/types";

export default function AddBusPage() {
  const { user } = useUser();
  const router = useRouter();
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.rol !== 'master' && user.rol !== 'manager' && user.rol !== 'colegio') {
      router.replace('/dashboard');
      setLoading(false);
      return;
    }
    
    async function fetchInitialData() {
        const supabase = createClient();
        if (user?.rol === 'master' || user?.rol === 'manager') {
            const { data: colegiosData } = await supabase.from('colegios_view').select('*').order('nombre');
            setColegios(colegiosData || []);
        } else if (user?.rol === 'colegio') {
             const { data: colegioData } = await supabase.from('colegios').select('id').eq('usuario_id', user.id).single();
             if (colegioData) {
                 const [
                     { data: conductoresData },
                     { data: rutasData }
                 ] = await Promise.all([
                    supabase.from('conductores').select('*').eq('colegio_id', colegioData.id).eq('activo', true),
                    supabase.from('rutas').select('*').eq('colegio_id', colegioData.id)
                 ]);
                 setConductores(conductoresData || []);
                 setRutas(rutasData || []);
             }
        }
        setLoading(false);
    }
    
    fetchInitialData();

  }, [user, router]);


  if (loading || !user) {
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
        title="Agregar Nuevo Autobús"
        description="Completa los datos para registrar un nuevo autobús."
      />
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Formulario de Autobús</CardTitle>
          <CardDescription>Los campos marcados con * son obligatorios.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddBusForm user={user} colegios={colegios} conductoresInit={conductores} rutasInit={rutas} />
        </CardContent>
      </Card>
    </div>
  );
}
