'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client"; // Changed to client
import type { Profile } from "@/lib/types";
import { useEffect, useState } from "react";
import { AddUserDialog } from "./add-user-dialog";

function getRoleVariant(role: string | null) {
  switch (role) {
    case 'master':
      return 'destructive';
    case 'manager':
      return 'default';
    case 'colegio':
      return 'secondary';
    case 'padre':
      return 'outline';
    default:
      return 'outline';
  }
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          nombre,
          apellido,
          rol,
          user:users (
            email
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
        })) || [];
        setProfiles(formattedProfiles);
      }
      setLoading(false);
    }

    fetchProfiles();
  }, []);

  const handleUserAdded = (newUser: Profile) => {
    setProfiles(prev => [...prev, newUser]);
  }

  if (error) {
    return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>{error}</p></CardContent></Card>
  }
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Usuarios y Roles"
        description="Administra los perfiles de usuario y sus respectivos roles en el sistema."
      >
        <AddUserDialog onUserAdded={handleUserAdded} />
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Un total de {profiles.length} usuarios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden md:table-cell">ID de Usuario</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                </TableRow>
              ) : (
                profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile.avatar_url || ''} alt={`${profile.nombre || ''} ${profile.apellido || ''}`} data-ai-hint="person face" />
                          <AvatarFallback>{(profile.nombre?.[0] || '')}{(profile.apellido?.[0] || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                          {profile.nombre || 'Sin'} {profile.apellido || 'Nombre'}
                          <div className="text-sm text-muted-foreground">{profile.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(profile.rol)}>{profile.rol}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{profile.id}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>Editar Rol</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={profile.rol === 'master'}
                          >
                            Eliminar Usuario
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}