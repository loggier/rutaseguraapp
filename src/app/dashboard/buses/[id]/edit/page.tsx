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
  const [initialRutas, setInitialRutas] = useState<Ruta[]>([]);
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
        } else {
            setBus(busData as Autobus);
        }
        
        const targetColegioId = busData?.colegio_id;

        const promises: Promise<any>[] = [];
        
        if (user?.rol === 'master' || user?.rol === 'manager') {
            promises.push(supabase.from('colegios_view').select('*').order('nombre'));
            promises.push(supabase.from('conductores_view').select('*'));
        } else if (user?.rol === 'colegio' && targetColegioId) {
             promises.push(supabase.from('conductores_view').select('*').eq('colegio_id', targetColegioId));
        }

        if(targetColegioId) {
            promises.push(supabase.from('rutas').select('*').eq('colegio_id', targetColegioId));
        }

        const results = await Promise.all(promises);
        let resultIndex = 0;
        
        if (user?.rol === 'master' || user?.rol === 'manager') {
            const colegiosResult = results[resultIndex++];
            setColegios(colegiosResult.data || []);
            
            const conductoresResult = results[resultIndex++];
            setAllConductores(conductoresResult.data || []);
        } else if (user?.rol === 'colegio') {
             const conductoresResult = results[resultIndex++];
             setAllConductores(conductoresResult.data || []);
        }

        if(targetColegioId) {
            const rutasResult = results[resultIndex];
            if (rutasResult) setInitialRutas(rutasResult.data || []);
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
          <EditBusForm user={user} bus={bus} colegios={colegios} allConductores={allConductores} initialRutas={initialRutas} />
        </CardContent>
      </Card>
    </div>
  );
}
