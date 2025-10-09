'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { useEffect, useState } from "react";
import { AddParentDialog } from "./add-parent-dialog";
import { ParentsTable } from "./parents-table";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/user-context";

export default function ParentsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    async function fetchProfiles() {
      const supabase = createClient();
      let query = supabase
        .from("profiles")
        .select(`
          id,
          nombre,
          apellido,
          rol,
          colegio_id,
          user:users (
            email,
            activo
          )
        `)
        .eq('rol', 'padre');
      
      // Si el rol es colegio, solo trae sus padres
      if (user?.rol === 'colegio') {
        const {data: currentColegio} = await supabase.from('colegios').select('id').eq('usuario_id', user.id).single();
        if(currentColegio) {
            query = query.eq('colegio_id', currentColegio.id);
        } else {
             setProfiles([]);
             setLoading(false);
             return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error cargando perfiles de padres:", error);
        setError(`No se pudieron cargar los perfiles: ${error.message}`);
      } else {
         const formattedProfiles: Profile[] = data?.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          rol: p.rol,
          email: p.user.email,
          activo: p.user.activo,
          colegio_id: p.colegio_id,
        })) || [];
        setProfiles(formattedProfiles);
      }
      setLoading(false);
    }

    if (user?.rol === 'master' || user?.rol === 'manager' || user?.rol === 'colegio') {
        fetchProfiles();
    } else {
        setLoading(false);
    }
  }, [user]);

  const handleParentAdded = (newUser: Profile) => {
    setProfiles(prev => [newUser, ...prev]);
  }

  const handleParentUpdated = (updatedUser: Profile) => {
    setProfiles(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
  }

  const handleParentStatusChanged = (userId: string, newStatus: boolean) => {
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, activo: newStatus } : p));
  }
  
  const handleParentDeleted = (userId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== userId));
  }

  const canManage = user?.rol === 'master' || user?.rol === 'manager' || user?.rol === 'colegio';

  if (!canManage && !loading) {
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
        title="Gestión de Padres y Tutores"
        description="Administra los perfiles de los padres/tutores y su acceso al sistema."
      >
        {canManage && <AddParentDialog onParentAdded={handleParentAdded} />}
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Padres/Tutores</CardTitle>
          <CardDescription>Un total de {profiles.length} padres/tutores registrados.</CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando...</p>
             </div>
           ) : (
             <ParentsTable 
                profiles={profiles}
                onParentUpdated={handleParentUpdated}
                onParentStatusChanged={handleParentStatusChanged}
                onParentDeleted={handleParentDeleted}
              />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
