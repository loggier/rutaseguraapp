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
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Route, Users, MapPin, Sunrise, Sunset, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from '@/contexts/user-context';
import { createClient } from '@/lib/supabase/client';
import type { Ruta } from '@/lib/types';
import Link from 'next/link';

export default function RoutesPage() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchRoutes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase.from('rutas').select(`*, estudiantes_count:ruta_estudiantes(count)`);

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
          estudiantes_count: r.estudiantes_count?.[0]?.count || 0,
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
    fetchRoutes();
  }, [fetchRoutes]);
  
  const canManage = user?.rol === 'master' || user?.rol === 'manager' || user?.rol === 'colegio';

  return (
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
          {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando rutas...</p>
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-8 flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8" />
                <p>{error}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de la Ruta</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Hora Salida</TableHead>
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
                    <TableCell>
                      <Badge variant={ruta.turno === 'Recogida' ? 'outline' : 'secondary'} className="gap-1">
                        {ruta.turno === 'Recogida' ? <Sunrise className="h-3 w-3"/> : <Sunset className="h-3 w-3" />}
                        {ruta.turno}
                      </Badge>
                    </TableCell>
                    <TableCell>{ruta.hora_salida}</TableCell>
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
                          <DropdownMenuItem>Editar Ruta</DropdownMenuItem>
                          <DropdownMenuItem>Gestionar Estudiantes</DropdownMenuItem>
                          <DropdownMenuItem>Asignar Viaje</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
