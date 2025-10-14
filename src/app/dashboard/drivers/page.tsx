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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, User, School, Loader2, AlertCircle, Trash2, Edit, UserCheck, UserX, Bus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from '@/contexts/user-context';
import { createClient } from '@/lib/supabase/client';
import type { Conductor } from '@/lib/types';
import { EditDriverDialog } from './edit-driver-dialog';
import { DeleteDriverAlert } from './delete-driver-alert';
import { UpdateDriverStatusAlert } from './update-driver-status-alert';
import Link from 'next/link';

function getStatusVariant(activo: boolean) {
  return activo ? 'default' : 'secondary';
}

function DriversPageComponent() {
  const { user } = useUser();
  const [drivers, setDrivers] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [driverToDelete, setDriverToDelete] = useState<Conductor | null>(null);
  const [driverToEdit, setDriverToEdit] = useState<Conductor | null>(null);
  const [driverToUpdateStatus, setDriverToUpdateStatus] = useState<Conductor | null>(null);

  const fetchDrivers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let driversQuery = supabase.from('conductores_view').select('*');

      if (user.rol === 'colegio') {
         const { data: currentColegio, error: colegioError } = await supabase
            .from('colegios')
            .select('id')
            .eq('usuario_id', user.id)
            .single();

        if (colegioError || !currentColegio) {
            throw new Error('No se pudo encontrar el colegio para este usuario.');
        }
        driversQuery = driversQuery.eq('colegio_id', currentColegio.id);
      }

      const { data: driversData, error: driversError } = await driversQuery.order('apellido');
      if (driversError) throw driversError;

      setDrivers(driversData as Conductor[]);

    } catch (err: any) {
      console.error("Error cargando conductores:", err);
      setError(`No se pudieron cargar los conductores: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDrivers();
    }
  }, [user, fetchDrivers]);
  
  const handleDriverUpdated = (updatedDriver: Conductor) => {
    setDrivers(prev => prev.map(driver => driver.id === updatedDriver.id ? updatedDriver : driver));
    fetchDrivers(); // Re-fetch to update assignment info
  };

  const handleDriverStatusUpdated = (driverId: string, newStatus: boolean) => {
    setDrivers(prev => prev.map(driver => driver.id === driverId ? { ...driver, activo: newStatus } : driver));
  };
  
  const handleDriverDeleted = (driverId: string) => {
    setDrivers(prev => prev.filter(r => r.id !== driverId));
  }

  const canManage = user?.rol === 'master' || user?.rol === 'manager' || user?.rol === 'colegio';
  const isAdmin = user?.rol === 'master' || user?.rol === 'manager';
  
  let content;

  if (loading) {
    content = (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando conductores...</p>
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
            <TableHead>Nombre</TableHead>
            <TableHead>Licencia</TableHead>
            {isAdmin && <TableHead>Colegio</TableHead>}
            <TableHead>Autobús Asignado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((conductor) => (
            <TableRow key={conductor.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={conductor.avatar_url || undefined} alt={`${conductor.nombre} ${conductor.apellido}`} data-ai-hint="person face" />
                    <AvatarFallback>{conductor.nombre[0]}{conductor.apellido[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    {conductor.nombre} {conductor.apellido}
                    <div className="text-sm text-muted-foreground">{conductor.telefono || 'Sin teléfono'}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{conductor.licencia}</TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                      <School className="h-4 w-4 text-muted-foreground" />
                      {conductor.colegio_nombre || 'No asignado'}
                  </div>
                </TableCell>
              )}
              <TableCell>
                {conductor.placa_autobus ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Bus className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{conductor.placa_autobus}</Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No asignado</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(conductor.activo)}>{conductor.activo ? 'Activo' : 'Inactivo'}</Badge>
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
                    <DropdownMenuItem onSelect={() => setDriverToEdit(conductor)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Conductor
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDriverToUpdateStatus(conductor)}>
                        {conductor.activo ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                        <span>{conductor.activo ? 'Desactivar' : 'Activar'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onSelect={(e) => { e.preventDefault(); setDriverToDelete(conductor); }}
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
          title="Gestión de Conductores"
          description="Administra los perfiles de los conductores, sus licencias y asignaciones."
        >
          {canManage && (
              <Button asChild size="sm" className="gap-1">
                <Link href="/dashboard/drivers/add">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Agregar Conductor</span>
                </Link>
              </Button>
          )}
        </PageHeader>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista de Conductores</CardTitle>
            <CardDescription>Un total de {drivers.length} conductores registrados.</CardDescription>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </div>
      
      {driverToEdit && canManage && user && (
          <EditDriverDialog
            isOpen={!!driverToEdit}
            onClose={() => setDriverToEdit(null)}
            onDriverUpdated={handleDriverUpdated}
            user={user}
            driver={driverToEdit}
        />
      )}

      {driverToUpdateStatus && (
        <UpdateDriverStatusAlert
          driver={driverToUpdateStatus}
          isOpen={!!driverToUpdateStatus}
          onClose={() => setDriverToUpdateStatus(null)}
          onDriverStatusUpdated={handleDriverStatusUpdated}
        />
      )}

      {driverToDelete && (
        <DeleteDriverAlert
          driver={driverToDelete}
          isOpen={!!driverToDelete}
          onClose={() => setDriverToDelete(null)}
          onDriverDeleted={handleDriverDeleted}
        />
      )}
    </>
  );
}

export default function DriversPage() {
    const { user } = useUser();
    if (!user) {
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando usuario...</p>
            </div>
        );
    }
    return <DriversPageComponent />;
}
