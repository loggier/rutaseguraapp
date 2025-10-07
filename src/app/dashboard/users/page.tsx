
import { createServerClient } from "@supabase/ssr";
import { cookies, type CookieOptions } from "next/headers";
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
import { MoreHorizontal, PlusCircle, Shield } from "lucide-react";
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

type FormattedProfile = Profile & {
    email: string;
    avatar_url: string | null;
}

export default async function UsersPage() {
  const cookieStore = cookies()
  
  // 1. Obtener todos los perfiles de `rutasegura.profiles`
  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value
            }
        }
      }
  );

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select('*');
    
  if (profilesError) {
    return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>No se pudieron cargar los perfiles: {profilesError.message}</p></CardContent></Card>
  }

  // 2. Obtener todos los usuarios de `auth.users`
  // Esta es una operación de administrador y requiere la service_role_key
  // Se debe crear un cliente específico para esta operación
  const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
                // No-op for server components
            },
            remove(name: string, options: CookieOptions) {
                // No-op for server components
            },
        }
      }
  );

  const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    console.error("Error de autenticación al listar usuarios:", authError.message);
    return <Card><CardHeader><CardTitle>Error de Autorización</CardTitle></CardHeader><CardContent><p>No tienes permiso para ver los usuarios. Error: {authError.message}</p></CardContent></Card>
  }
  
  // 3. Unir los datos en el código
  const formattedProfiles: FormattedProfile[] = profiles?.map(profile => {
    const authUser = authUsers.find(u => u.id === profile.id);
    return {
      ...profile,
      email: authUser?.email || 'Sin email',
      avatar_url: authUser?.user_metadata?.avatar_url || null,
    };
  }) || [];


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
