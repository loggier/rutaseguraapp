'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Colegio, Conductor, Ruta, Autobus } from "@/lib/types";
import { EditBusForm } from "./edit-bus-form";
import { notFound } from 'next/navigation';

export default function EditBusPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUser();
  const router = useRouter();
  const [bus, setBus] = useState<Autobus | null>(null);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = use(params);

  useEffect(() => {
    if (!user) return;
     if (user.rol !== 'master' && user.rol !== 'manager' && user.rol !== 'colegio') {
      router.replace('/dashboard');
      return;
    }
    
    async function fetchData() {
        const supabase = createClient();
        
        // Fetch bus data with an explicit join to get conductor name regardless of status
        const { data: busData, error: busError } = await supabase
            .from('autobuses')
            .select(`
                *,
                colegio:colegios(nombre),
                conductor:conductores(nombre, apellido),
                ruta:rutas(nombre)
            `)
            .eq('id', id)
            .single();

        if (busError || !busData) {
            console.error("Error fetching bus:", busError);
            setLoading(false);
            return;
        }

        // Format the data to match the Autobus type with joined names
        const formattedBus = {
          ...busData,
          colegio_nombre: busData.colegio?.nombre || 'No asignado',
          conductor_nombre: busData.conductor ? `${busData.conductor.nombre} ${busData.conductor.apellido}` : 'No asignado',
          ruta_nombre: busData.ruta?.nombre || 'No asignada',
        } as Autobus;
        
        setBus(formattedBus);
        
        const targetColegioId = formattedBus.colegio_id;

        if (user?.rol === 'master' || user?.rol === 'manager') {
            const { data: colegiosData } = await supabase.from('colegios_view').select('*').order('nombre');
            setColegios(colegiosData || []);
        }

        if (targetColegioId) {
             const [
                { data: conductoresData },
                { data: rutasData }
            ] = await Promise.all([
                supabase.from('conductores').select('*').eq('colegio_id', targetColegioId),
                supabase.from('rutas').select('*').eq('colegio_id', targetColegioId)
            ]);
            setConductores(conductoresData || []);
            setRutas(rutasData || []);
        }
        setLoading(false);
    }
    
    fetchData();

  }, [user, router, id]);

  if (loading || !user) {
     return (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  if (!bus) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Editar Autobús: ${bus.matricula}`}
        description="Actualiza los detalles del autobús."
      />
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Formulario de Autobús</CardTitle>
          <CardDescription>Realiza los cambios necesarios y guarda.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditBusForm user={user} bus={bus} colegios={colegios} conductoresInit={conductores} rutasInit={rutas} />
        </CardContent>
      </Card>
    </div>
  );
}
