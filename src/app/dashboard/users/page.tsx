'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { useEffect, useState } from "react";
import { AddUserDialog } from "./add-user-dialog";
import { UsersTable } from "./users-table";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/user-context";

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    async function fetchProfiles() {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          nombre,
          apellido,
          rol,
          user:users (
            email,
            activo
          )
        `);

      if (error) {
        console.error("Error cargando perfiles:", error);
        setError(`No se pudieron cargar los perfiles: ${error.message}`);
      } else {
         const formattedProfiles: Profile[] = data?.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          rol: p.rol,
          email: p.user.email,
          activo: p.user.activo,
        })) || [];
        setProfiles(formattedProfiles);
      }
      setLoading(false);
    }

    if (user?.rol === 'master' || user?.rol === 'manager') {
        fetchProfiles();
    } else {
        setLoading(false);
    }
  }, [user]);

  const handleUserAdded = (newUser: Profile) => {
    setProfiles(prev => [newUser, ...prev]);
  }

  const handleUserUpdated = (updatedUser: Profile) => {
    setProfiles(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
  }

  const handleUserStatusChanged = (userId: string, newStatus: boolean) => {
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, activo: newStatus } : p));
  }
  
  const handleUserDeleted = (userId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== userId));
  }

  const canManageUsers = user?.rol === 'master' || user?.rol === 'manager';

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  if (!canManageUsers) {
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
        title="Gestión de Usuarios y Roles"
        description="Administra los perfiles de usuario y sus respectivos roles en el sistema."
      >
        {canManageUsers && <AddUserDialog onUserAdded={handleUserAdded} />}
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Un total de {profiles.length} usuarios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando usuarios...</p>
             </div>
           ) : (
             <UsersTable 
                profiles={profiles}
                onUserUpdated={handleUserUpdated}
                onUserStatusChanged={handleUserStatusChanged}
                onUserDeleted={handleUserDeleted}
              />
           )}
        </CardContent>
      </Card>
    </div>
  );
}

    