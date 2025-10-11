'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from '@/lib/supabase/client';
import type { Colegio } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { SchoolsTable } from './schools-table';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SchoolsPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  
  useEffect(() => {
    async function fetchColegios() {
      if (!user) return;
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('colegios_view')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error("Error cargando colegios desde la vista:", error);
        const errorMessage = `No se pudieron cargar los colegios: ${error.message}`;
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error de Carga",
          description: errorMessage,
        });
      } else {
        setColegios(data as Colegio[]);
      }
      setLoading(false);
    }

    if (user?.rol === 'master' || user?.rol === 'manager') {
      fetchColegios();
    } else {
        setLoading(false);
    }
  }, [user, toast]);
  
  const handleSchoolUpdated = (updatedSchool: Colegio) => {
    setColegios(prev => prev.map(c => c.id === updatedSchool.id ? updatedSchool : c));
  }

  const handleSchoolStatusChanged = (schoolId: string, newStatus: boolean) => {
    setColegios(prev => prev.map(c => c.id === schoolId ? { ...c, activo: newStatus } : c));
  }
  
  const handleSchoolDeleted = (schoolId: string) => {
    setColegios(prev => prev.filter(c => c.id !== schoolId));
  }

  const canManageSchools = user?.rol === 'master' || user?.rol === 'manager';

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  if (!canManageSchools) {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No tienes permiso para ver esta página.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Colegios"
        description="Administra las cuentas de los colegios, sus datos y usuarios asociados."
      >
        {canManageSchools && (
          <Button asChild size="sm" className="gap-1">
            <Link href="/dashboard/schools/add">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Agregar Colegio</span>
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Colegios</CardTitle>
          <CardDescription>Un total de {colegios.length} colegios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Cargando colegios...</p>
            </div>
          ) : error ? (
             <div className="text-center text-destructive py-8">{error}</div>
          ) : (
            <SchoolsTable
              colegios={colegios}
              onSchoolStatusChanged={handleSchoolStatusChanged}
              onSchoolDeleted={handleSchoolDeleted}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
