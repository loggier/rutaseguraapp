'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, MapPin } from 'lucide-react';
import type { Estudiante, Parada } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { StopFormDialog } from './stop-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type StopsManagementProps = {
  student: Estudiante;
  initialStops: Parada[];
};

export function StopsManagement({ student, initialStops }: StopsManagementProps) {
  const [stops, setStops] = useState<Parada[]>(initialStops);
  const [stopToEdit, setStopToEdit] = useState<Parada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenModal = (stop: Parada | null = null) => {
    setStopToEdit(stop);
    setIsModalOpen(true);
  };

  const handleStopSaved = (savedStop: Parada) => {
    if (stopToEdit) {
      // Edit
      setStops(stops.map(s => (s.id === savedStop.id ? savedStop : s.activo ? { ...s, activo: false } : s)));
    } else {
      // Add
      setStops([...stops.map(s => (savedStop.activo ? { ...s, activo: false } : s)), savedStop]);
    }
  };
  
  const handleDeleteStop = async (stopId: string) => {
    try {
      const response = await fetch(`/api/stops/${stopId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setStops(stops.filter(s => s.id !== stopId));
      toast({ title: 'Éxito', description: 'Parada eliminada correctamente.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const existingTypes = stops.map(s => s.tipo);
  const canAddRecogida = !existingTypes.includes('Recogida');
  const canAddEntrega = !existingTypes.includes('Entrega');

  return (
    <>
      <div className="flex justify-end mb-4">
        {stops.length < 2 && (
          <Button size="sm" onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Parada
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Subtipo</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stops.length > 0 ? (
              stops.map(stop => (
                <TableRow key={stop.id}>
                  <TableCell className="font-medium">
                    <Badge variant={stop.tipo === 'Recogida' ? 'default' : 'secondary'}>{stop.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    {stop.sub_tipo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{stop.direccion}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stop.activo ? 'outline' : 'secondary'} className={stop.activo ? "border-green-500 text-green-500" : ""}>
                      {stop.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(stop)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará la parada de tipo <strong>{stop.tipo}</strong> para este estudiante.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteStop(stop.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay paradas asignadas a este estudiante.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <StopFormDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          student={student}
          stop={stopToEdit}
          onStopSaved={handleStopSaved}
          availableStopTypes={{ canAddRecogida, canAddEntrega }}
        />
      )}
    </>
  );
}
