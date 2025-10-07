
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
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/types';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['master', 'manager', 'colegio', 'padre'], {
    required_error: 'El rol es requerido',
  }),
});

type FormValues = z.infer<typeof formSchema>;

type AddUserDialogProps = {
  onUserAdded: (newUser: Profile) => void;
};

export function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      rol: undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el usuario.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El usuario ha sido creado correctamente.',
      });
      onUserAdded(data.user);
      setOpen(false);
      form.reset();

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
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Agregar Usuario</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa los campos para registrar un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" {...form.register('email')} className="col-span-3" />
            </div>
            {form.formState.errors.email && <p className="text-sm text-destructive col-start-2 col-span-3">{form.formState.errors.email.message}</p>}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input id="password" type="password" {...form.register('password')} className="col-span-3" />
            </div>
             {form.formState.errors.password && <p className="text-sm text-destructive col-start-2 col-span-3">{form.formState.errors.password.message}</p>}
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rol" className="text-right">
                Rol
              </Label>
               <Select onValueChange={(value) => form.setValue('rol', value as FormValues['rol'])} defaultValue={form.getValues('rol')}>
                <SelectTrigger className="col-span-3">
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
              Crear Usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}