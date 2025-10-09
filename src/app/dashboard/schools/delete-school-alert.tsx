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

type DeleteSchoolAlertProps = {
  school: Colegio;
  children: React.ReactNode;
  onSchoolDeleted: (schoolId: string) => void;
};

export function DeleteSchoolAlert({ school, children, onSchoolDeleted }: DeleteSchoolAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/colegios/${school.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error al eliminar el colegio.`);
      }

      toast({
        title: 'Éxito',
        description: data.message,
      });

      onSchoolDeleted(school.id);
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
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. Se eliminará permanentemente el colegio{' '}
            <span className="font-semibold">{school.nombre}</span>{' '}
            y su cuenta de usuario asociada ({school.email}). Todos los datos vinculados se perderán.
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
