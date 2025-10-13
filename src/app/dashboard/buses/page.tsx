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
import { MoreHorizontal, PlusCircle, Bus, User, School, Loader2, AlertCircle, Trash2, Edit } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from '@/contexts/user-context';
import { createClient } from '@/lib/supabase/client';
import type { Autobus } from '@/lib/types';
import { DeleteBusAlert } from './delete-bus-alert';
import { AddBusDialog } from './add-bus-dialog';
import { EditBusDialog } from './edit-bus-dialog';


function getStatusVariant(status: string) {
  switch (status) {
    case 'activo':
      return 'default';
    case 'inactivo':
      return 'secondary';
    case 'mantenimiento':
      return 'destructive';
    default:
      return 'outline';
  }
}

function BusesPageComponent() {
  const { user } = useUser();
  const [buses, setBuses] = useState<Autobus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [busToDelete, setBusToDelete] = useState<Autobus | null>(null);
  const [busToEdit, setBusToEdit] = useState<Autobus | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);


  const fetchBuses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase.from('autobuses_view').select(`*`);

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

      const { data: busesData, error: busesError } = await query.order('matricula');

      if (busesError) throw busesError;
      
      setBuses(busesData as Autobus[]);

    } catch (err: any) {
      console.error("Error cargando autobuses:", err);
      setError(`No se pudieron cargar los autobuses: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBuses();
    }
  }, [user, fetchBuses]);
  
  const handleBusAdded = (newBus: Autobus) => {
    setBuses(prev => [...prev, newBus].sort((a, b) => a.matricula.localeCompare(b.matricula)));
  };
  
  const handleBusUpdated = (updatedBus: Autobus) => {
    setBuses(prev => prev.map(bus => bus.id === updatedBus.id ? updatedBus : bus));
  };
  
  const handleBusDeleted = (busId: string) => {
    setBuses(prev => prev.filter(r => r.id !== busId));
  }

  const canManage = user?.rol === 'master' || user?.rol === 'manager' || user?.rol === 'colegio';
  const isAdmin = user?.rol === 'master' || user?.rol === 'manager';
  
  let content;

  if (loading) {
    content = (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando autobuses...</p>
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
            <TableHead>Matrícula</TableHead>
            {isAdmin && <TableHead>Colegio</TableHead>}
            <TableHead>Capacidad</TableHead>
            <TableHead className="hidden md:table-cell">Conductor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buses.map((autobus) => (
            <TableRow key={autobus.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Bus className="h-5 w-5 text-muted-foreground" />
                  <span>{autobus.matricula}</span>
                </div>
                 <div className="text-xs text-muted-foreground font-mono pl-8">{autobus.imei_gps}</div>
              </TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                        <School className="h-4 w-4 text-muted-foreground" />
                        {autobus.colegio_nombre || 'No asignado'}
                    </div>
                  </TableCell>
                )}
              <TableCell>{autobus.capacidad} pasajeros</TableCell>
              <TableCell className="hidden md:table-cell text-sm">
                 {autobus.conductor_nombre ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{autobus.conductor_nombre}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No asignado</span>
                    )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(autobus.estado)}>{autobus.estado}</Badge>
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
                    <DropdownMenuItem onSelect={() => setBusToEdit(autobus)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Autobús
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onSelect={(e) => { e.preventDefault(); setBusToDelete(autobus); }}
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
          title="Gestión de Autobuses"
          description="Administra la flota de autobuses, su capacidad y estado."
        >
          {canManage && (
              <Button size="sm" className="gap-1" onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Agregar Autobús</span>
              </Button>
          )}
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Flota de Autobuses</CardTitle>
            <CardDescription>Un total de {buses.length} autobuses en la flota.</CardDescription>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </div>

      {canManage && user && (
         <AddBusDialog
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onBusAdded={handleBusAdded}
            user={user}
        />
      )}
      
      {busToEdit && canManage && user && (
          <EditBusDialog
            isOpen={!!busToEdit}
            onClose={() => setBusToEdit(null)}
            onBusUpdated={handleBusUpdated}
            user={user}
            bus={busToEdit}
        />
      )}

      {busToDelete && (
        <DeleteBusAlert
          bus={busToDelete}
          isOpen={!!busToDelete}
          onClose={() => setBusToDelete(null)}
          onBusDeleted={handleBusDeleted}
        />
      )}
    </>
  );
}

export default function BusesPage() {
    const { user } = useUser();
    if (!user) {
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando usuario...</p>
            </div>
        );
    }
    return <BusesPageComponent />;
}
