'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/types';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  rol: z.enum(['master', 'manager', 'colegio', 'padre'], {
    required_error: 'El rol es requerido',
  }),
});

type FormValues = z.infer<typeof formSchema>;

type EditUserDialogProps = {
  user: Profile;
  onUserUpdated: (updatedUser: Profile) => void;
  children: React.ReactNode;
};

export function EditUserDialog({ user, onUserUpdated, children }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      rol: user.rol,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el usuario.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El usuario ha sido actualizado correctamente.',
      });

      onUserUpdated(data.user);
      setOpen(false);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información del usuario. El email no puede ser modificado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" value={user.email} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input id="nombre" {...form.register('nombre')} className="col-span-3" />
            </div>
             {form.formState.errors.nombre && <p className="text-sm text-destructive col-start-2 col-span-3">{form.formState.errors.nombre.message}</p>}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apellido" className="text-right">
                Apellido
              </Label>
              <Input id="apellido" {...form.register('apellido')} className="col-span-3" />
            </div>
             {form.formState.errors.apellido && <p className="text-sm text-destructive col-start-2 col-span-3">{form.formState.errors.apellido.message}</p>}
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rol" className="text-right">
                Rol
              </Label>
               <Select onValueChange={(value) => form.setValue('rol', value as FormValues['rol'])} defaultValue={form.getValues('rol')}>
                <SelectTrigger className="col-span-3" disabled={user.rol === 'master'}>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="colegio">Colegio</SelectItem>
                  <SelectItem value="padre">Padre</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
             {form.formState.errors.rol && <p className="text-sm text-destructive col-start-2 col-span-3">{form.formState.errors.rol.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
