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
import type { Estudiante } from "@/lib/types";
import { Loader2 } from "lucide-react";

type UpdateStatusAlertProps = {
  student: Estudiante;
  isOpen: boolean;
  onClose: () => void;
  onStudentStatusChanged: (studentId: string, newStatus: boolean) => void;
};

export function UpdateStudentStatusAlert({ student, isOpen, onClose, onStudentStatusChanged }: UpdateStatusAlertProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const newStatus = !student.activo;
  const actionText = newStatus ? 'activar' : 'desactivar';

  const handleUpdateStatus = async () => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error al ${actionText} el estudiante.`);
      }

      toast({
        title: 'Éxito',
        description: data.message,
      });

      onStudentStatusChanged(student.id, data.newStatus);
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
          <AlertDialogTitle>¿Seguro que quieres {actionText} a este estudiante?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción cambiará el estado del estudiante{' '}
            <span className="font-semibold">{student.nombre} {student.apellido}</span>.
            {newStatus ? ' El estudiante será considerado activo en el sistema.' : ' El estudiante no podrá ser asignado a viajes, etc.'}
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
