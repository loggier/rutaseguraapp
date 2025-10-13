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
import type { Autobus } from "@/lib/types";
import { Loader2 } from "lucide-react";

type DeleteBusAlertProps = {
  bus: Autobus;
  isOpen: boolean;
  onClose: () => void;
  onBusDeleted: (busId: string) => void;
};

export function DeleteBusAlert({ bus, isOpen, onClose, onBusDeleted }: DeleteBusAlertProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/buses/${bus.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error al eliminar el autobús.`);
      }

      toast({
        title: 'Éxito',
        description: data.message,
      });

      onBusDeleted(bus.id);
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
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. Se eliminará permanentemente el autobús con matrícula{' '}
            <span className="font-semibold">{bus.matricula}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sí, eliminar permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
