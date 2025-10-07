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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/lib/types";
import { Loader2 } from "lucide-react";

type UpdateStatusAlertProps = {
  user: Profile;
  isOpen: boolean;
  onClose: () => void;
  onUserStatusChanged: (userId: string, newStatus: boolean) => void;
};

export function UpdateStatusAlert({ user, isOpen, onClose, onUserStatusChanged }: UpdateStatusAlertProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const newStatus = !user.activo;
  const actionText = newStatus ? 'activar' : 'desactivar';

  const handleUpdateStatus = async () => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE', // Our DELETE endpoint handles status changes
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error al ${actionText} el usuario.`);
      }

      toast({
        title: 'Éxito',
        description: `El usuario ha sido ${actionText} correctamente.`,
      });

      onUserStatusChanged(user.id, data.newStatus);
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

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de que quieres {actionText} al usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción cambiará el estado del usuario{' '}
            <span className="font-semibold">{user.nombre} {user.apellido} ({user.email})</span>.
            {newStatus ? ' El usuario podrá iniciar sesión y acceder al sistema.' : ' El usuario no podrá iniciar sesión.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpdateStatus}
            disabled={isPending}
            className={!newStatus ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sí, {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
