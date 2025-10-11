'use client';

import { useState, useEffect, useCallback } from 'react';
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Route, Users, School, Clock, Loader2, AlertCircle, Trash2, Edit } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from '@/contexts/user-context';
import { createClient } from '@/lib/supabase/client';
import type { Ruta } from '@/lib/types';
import Link from 'next/link';
import { DeleteRouteAlert } from './delete-route-alert';

function RoutesPageComponent() {
  const { user } = useUser();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<Ruta | null>(null);

  const fetchRoutes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase.from('rutas').select(`*, colegio:colegios(id, nombre), estudiantes_count:ruta_estudiantes(count)`);

      if (user.rol === 'colegio') {
         const { data: currentColegio, error: colegioError } = await supabase
            .from('colegios')
            .select('id')
            .eq('usuario_id', user.id)
            .single();

        if (colegioError || !currentColegio) {
            throw new Error('No se pudo encontrar el colegio para este usuario.');
        }
        query = query.eq('colegio_id', currentColegio.id);
      }

      const { data: routesData, error: routesError } = await query.order('nombre');

      if (routesError) throw routesError;
      
      const formattedRoutes = routesData.map((r: any) => ({
          ...r,
          estudiantes_count: r.estudiantes_count[0]?.count || 0,
          colegio: Array.isArray(r.colegio) ? r.colegio[0] : r.colegio,
      }));

      setRutas(formattedRoutes);

    } catch (err: any) {
      console.error("Error cargando rutas:", err);
      setError(`No se pudieron cargar las rutas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRoutes();
    }
  }, [user, fetchRoutes]);
  
  const handleRouteDeleted = (routeId: string) => {
    setRutas(prev => prev.filter(r => r.id !== routeId));
  }

  const canManage = user?.rol === 'master' || user?.rol === 'manager' || user?.rol === 'colegio';
  const isAdmin = user?.rol === 'master' || user?.rol === 'manager';
  
  let content;

  if (loading) {
    content = (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando rutas...</p>
        </div>
    );
  } else if (error) {
    content = (
      <div className="text-center text-destructive py-8 flex flex-col items-center gap-2">
        <AlertCircle className="h-8 w-8" />
        <p>{error}</p>
      </div>
    );
  } else {
    content = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre de la Ruta</TableHead>
            {isAdmin && <TableHead>Colegio</TableHead>}
            <TableHead>Horarios</TableHead>
            <TableHead className="hidden md:table-cell">Estudiantes</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rutas.map((ruta) => (
            <TableRow key={ruta.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Route className="h-5 w-5 text-muted-foreground" />
                  <span>{ruta.nombre}</span>
                </div>
              </TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        {ruta.colegio?.nombre || 'No asignado'}
                    </div>
                  </TableCell>
                )}
              <TableCell>
                 <div className='flex flex-col gap-1'>
                    {ruta.hora_salida_manana && <Badge variant="outline">Mañana: {ruta.hora_salida_manana}</Badge>}
                    {ruta.hora_salida_tarde && <Badge variant="secondary">Tarde: {ruta.hora_salida_tarde}</Badge>}
                 </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {ruta.estudiantes_count}
                </div>
              </TableCell>
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
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/routes/${ruta.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Ruta
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/routes/${ruta.id}/manage`}>Gestionar Estudiantes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Asignar Viaje</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onSelect={(e) => { e.preventDefault(); setRouteToDelete(ruta); }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Gestión de Rutas"
          description="Crea, visualiza y administra las rutas de los autobuses."
        >
          {canManage && (
              <Button asChild size="sm" className="gap-1">
                  <Link href="/dashboard/routes/add">
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Crear Ruta</span>
                  </Link>
              </Button>
          )}
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Rutas</CardTitle>
            <CardDescription>Un total de {rutas.length} rutas configuradas.</CardDescription>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </div>

      {routeToDelete && (
        <DeleteRouteAlert
          ruta={routeToDelete}
          isOpen={!!routeToDelete}
          onClose={() => setRouteToDelete(null)}
          onRouteDeleted={handleRouteDeleted}
        />
      )}
    </>
  );
}

export default function RoutesPage() {
    // We wrap the main component in another one to allow useUser to be called unconditionally
    const { user } = useUser();
    if (!user) {
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando usuario...</p>
            </div>
        );
    }
    return <RoutesPageComponent />;
}
