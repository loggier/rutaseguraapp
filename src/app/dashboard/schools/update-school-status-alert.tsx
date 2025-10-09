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
import type { Colegio } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

type UpdateStatusAlertProps = {
  school: Colegio;
  children: React.ReactNode;
  onSchoolStatusChanged: (schoolId: string, newStatus: boolean) => void;
};

export function UpdateSchoolStatusAlert({ school, children, onSchoolStatusChanged }: UpdateStatusAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const newStatus = !school.activo;
  const actionText = newStatus ? 'activar' : 'desactivar';

  const handleUpdateStatus = async () => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/colegios/${school.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error al ${actionText} el colegio.`);
      }

      toast({
        title: 'Éxito',
        description: data.message,
      });

      onSchoolStatusChanged(school.id, data.newStatus);
      setIsOpen(false);

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
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsOpen(true); }}>
        {children}
      </DropdownMenuItem>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Seguro que quieres {actionText} este colegio?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción cambiará el estado del colegio{' '}
            <span className="font-semibold">{school.nombre}</span> y su cuenta de usuario asociada.
            {newStatus ? ' El colegio y su usuario podrán acceder al sistema.' : ' El colegio y su usuario ya no podrán iniciar sesión.'}
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
