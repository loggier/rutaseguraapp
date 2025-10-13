'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Conductor } from "@/lib/types";
import { Loader2 } from "lucide-react";

type UpdateStatusAlertProps = {
  driver: Conductor;
  isOpen: boolean;
  onClose: () => void;
  onDriverStatusUpdated: (driverId: string, newStatus: boolean) => void;
};

export function UpdateDriverStatusAlert({ driver, isOpen, onClose, onDriverStatusUpdated }: UpdateStatusAlertProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const newStatus = !driver.activo;
  const actionText = newStatus ? 'activar' : 'desactivar';

  const handleUpdateStatus = async () => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error al ${actionText} el conductor.`);
      }

      toast({
        title: 'Éxito',
        description: data.message,
      });

      onDriverStatusUpdated(driver.id, data.newStatus);
      onClose();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Seguro que quieres {actionText} a este conductor?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción cambiará el estado del conductor{' '}
            <span className="font-semibold">{driver.nombre} {driver.apellido}</span>.
             {newStatus ? ' El conductor podrá ser asignado a autobuses.' : ' El conductor no podrá ser asignado a nuevos viajes.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpdateStatus}
            disabled={isPending}
            className={!newStatus ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sí, {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
