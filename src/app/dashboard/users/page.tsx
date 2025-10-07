
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
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
import type { Profile } from "@/lib/types";

function getRoleVariant(role: string) {
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

export default async function UsersPage() {
  const cookieStore = cookies();
  const supabase = createClient();
  
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      nombre,
      apellido,
      rol,
      user:auth_users(email)
    `);

  // Supabase en RLS devuelve un array vacío si no hay data, no un error.
  // Pero si hay un error de conexión o de sintaxis, lo mostramos.
  if (error) {
    return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>No se pudieron cargar los usuarios: {error.message}</p></CardContent></Card>
  }
  
  // Como `user` puede ser un array o un objeto, lo normalizamos.
  const formattedProfiles = profiles?.map(p => ({
    ...p,
    // @ts-ignore
    email: Array.isArray(p.user) ? p.user[0]?.email : p.user?.email,
  })) || [];


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Usuarios y Roles"
        description="Administra los perfiles de usuario y sus respectivos roles en el sistema."
      >
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Agregar Usuario</span>
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Un total de {formattedProfiles.length} usuarios registrados en el sistema.</CardDescription>
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
              {formattedProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || ''} alt={`${profile.nombre} ${profile.apellido}`} data-ai-hint="person face" />
                        <AvatarFallback>{(profile.nombre?.[0] || '')}{(profile.apellido?.[0] || '')}</AvatarFallback>
                      </Avatar>
                      <div>
                        {profile.nombre || 'Sin'} {profile.apellido || 'Nombre'}
                        <div className="text-sm text-muted-foreground">{profile.email || 'Sin email'}</div>
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
                        <DropdownMenuItem className="text-destructive">
                          Eliminar Usuario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
