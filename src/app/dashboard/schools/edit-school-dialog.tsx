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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Colegio } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre del colegio es requerido'),
  ruc: z.string().length(13, 'El RUC debe tener 13 dígitos'),
  email_contacto: z.string().email('Email de contacto inválido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
});

type FormValues = z.infer<typeof formSchema>;

type EditSchoolDialogProps = {
  school: Colegio;
  children: React.ReactNode;
  onSchoolUpdated: (updatedSchool: Colegio) => void;
};

export function EditSchoolDialog({ school, children, onSchoolUpdated }: EditSchoolDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: school.nombre || '',
      ruc: school.ruc || '',
      email_contacto: school.email_contacto || '',
      telefono: school.telefono || '',
      direccion: school.direccion || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/colegios/${school.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el colegio.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El colegio ha sido actualizado correctamente.',
      });
      onSchoolUpdated(data.colegio);
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
      <DialogContent className="sm:max-w-4xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Colegio</DialogTitle>
            <DialogDescription>
              Actualiza los datos del colegio. El email de la cuenta no se puede modificar.
            </DialogDescription>
          </DialogHeader>
            <div className="grid md:grid-cols-2 gap-8 py-4">
              {/* Columna de Datos del Colegio */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Datos del Colegio</h4>
                <Separator />
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
              </div>

              {/* Columna de Datos de la Cuenta */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Cuenta de Usuario</h4>
                <Separator />
                 <div className='space-y-2'>
                    <Label htmlFor="email">Email (para inicio de sesión)</Label>
                    <Input id="email" type="email" value={school.email} disabled />
                </div>
              </div>
            </div>
          <DialogFooter className="pt-6">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
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
