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
  const [allConductores, setAllConductores] = useState<Conductor[]>([]);
  const [allRutas, setAllRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = use(params);

  useEffect(() => {
    if (!user) return;
     if (user.rol !== 'master' && user.rol !== 'manager' && user.rol !== 'colegio') {
      router.replace('/dashboard');
      return;
    }
    
    async function fetchData() {
        setLoading(true);
        const supabase = createClient();
        
        const { data: busData, error: busError } = await supabase
            .from('autobuses_view')
            .select('*')
            .eq('id', id)
            .single();

        if (busError || !busData) {
            console.error("Error fetching bus:", busError);
            setBus(null);
            setLoading(false);
            notFound();
            return;
        } 
        
        setBus(busData as Autobus);
        
        if (user.rol === 'master' || user.rol === 'manager') {
            const [
                { data: colegiosData },
                { data: conductoresData },
                { data: rutasData }
            ] = await Promise.all([
                supabase.from('colegios_view').select('*').order('nombre'),
                supabase.from('conductores_view').select('*'),
                supabase.from('rutas').select('*')
            ]);
            setColegios(colegiosData || []);
            setAllConductores(conductoresData || []);
            setAllRutas(rutasData || []);
        } else if (user.rol === 'colegio') {
            // A 'colegio' user should only see their own drivers and routes.
            // We get the colegio_id from the bus being edited.
            const targetColegioId = busData?.colegio_id;
            if (targetColegioId) {
              const [
                { data: conductoresData },
                { data: rutasData }
              ] = await Promise.all([
                supabase.from('conductores_view').select('*').eq('colegio_id', targetColegioId),
                supabase.from('rutas').select('*').eq('colegio_id', targetColegioId)
              ]);
              setAllConductores(conductoresData || []);
              setAllRutas(rutasData || []);
            }
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
    // This will be handled by notFound() inside useEffect, but as a fallback:
    return (
        <div className="flex h-64 w-full items-center justify-center">
            <p className="text-muted-foreground">Autobús no encontrado.</p>
        </div>
    );
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
          <EditBusForm 
            user={user} 
            bus={bus} 
            colegios={colegios} 
            allConductores={allConductores} 
            allRutas={allRutas} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
