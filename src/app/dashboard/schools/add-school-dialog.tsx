'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Colegio } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre del colegio es requerido'),
  ruc: z.string().min(13, 'El RUC debe tener 13 dígitos').max(13, 'El RUC debe tener 13 dígitos'),
  email_contacto: z.string().email('Email de contacto inválido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  codigo_postal: z.string().min(1, 'El código postal es requerido'),
  email: z.string().email('El email de la cuenta es inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

type AddSchoolDialogProps = {
  onSchoolAdded: (newSchool: Colegio) => void;
};

export function AddSchoolDialog({ onSchoolAdded }: AddSchoolDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      ruc: '',
      email_contacto: '',
      telefono: '',
      direccion: '',
      codigo_postal: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear un colegio.' });
        return;
    }
    
    setIsPending(true);
    try {
      const response = await fetch('/api/colegios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, creado_por: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el colegio.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El colegio ha sido creado correctamente.',
      });
      onSchoolAdded(data.colegio);
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
          <span>Agregar Colegio</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Colegio</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar un nuevo colegio y su cuenta de usuario asociada.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 pr-6">
            <div className="grid gap-4 py-4">
                <div className='space-y-2'>
                    <Label htmlFor="nombre">Nombre del Colegio</Label>
                    <Input id="nombre" {...form.register('nombre')} />
                    {form.formState.errors.nombre && <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>}
                </div>
                <div className='space-y-2'>
                    <Label htmlFor="ruc">RUC</Label>
                    <Input id="ruc" {...form.register('ruc')} />
                    {form.formState.errors.ruc && <p className="text-sm text-destructive">{form.formState.errors.ruc.message}</p>}
                </div>
                 <div className='space-y-2'>
                    <Label htmlFor="email_contacto">Email de Contacto</Label>
                    <Input id="email_contacto" {...form.register('email_contacto')} />
                    {form.formState.errors.email_contacto && <p className="text-sm text-destructive">{form.formState.errors.email_contacto.message}</p>}
                </div>
                 <div className='space-y-2'>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" {...form.register('telefono')} />
                    {form.formState.errors.telefono && <p className="text-sm text-destructive">{form.formState.errors.telefono.message}</p>}
                </div>
                <div className='space-y-2'>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input id="direccion" {...form.register('direccion')} />
                    {form.formState.errors.direccion && <p className="text-sm text-destructive">{form.formState.errors.direccion.message}</p>}
                </div>
                <div className='space-y-2'>
                    <Label htmlFor="codigo_postal">Código Postal</Label>
                    <Input id="codigo_postal" {...form.register('codigo_postal')} />
                    {form.formState.errors.codigo_postal && <p className="text-sm text-destructive">{form.formState.errors.codigo_postal.message}</p>}
                </div>
                
                <hr className='my-4'/>

                 <div className='space-y-2'>
                    <Label htmlFor="email">Email (Cuenta de Usuario)</Label>
                    <Input id="email" type="email" {...form.register('email')} />
                    {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                 <div className='space-y-2'>
                    <Label htmlFor="password">Contraseña (Cuenta de Usuario)</Label>
                    <Input id="password" type="password" {...form.register('password')} />
                    {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
                </div>
            </div>
            </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Colegio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}