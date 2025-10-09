'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profile, Colegio } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
import { createClient } from '@/lib/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  colegio_id: z.string().uuid("Debes seleccionar un colegio.").optional().nullable(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  email_adicional: z.string().email('Email adicional inválido').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

type EditParentDialogProps = {
  user: Profile;
  onUserUpdated: (updatedUser: Profile) => void;
  children: React.ReactNode;
};

export function EditParentDialog({ user, onUserUpdated, children }: EditParentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const { toast } = useToast();
  const { user: currentUser } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      colegio_id: user.colegio_id,
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      email_adicional: user.email_adicional || '',
    },
  });
  
  useEffect(() => {
    async function fetchColegios() {
      if (currentUser?.rol === 'master' || currentUser?.rol === 'manager') {
        const supabase = createClient();
        const { data } = await supabase.from('colegios_view').select('*').order('nombre');
        setColegios(data || []);
      }
    }
    if (open) {
        fetchColegios();
        form.reset({
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          colegio_id: user.colegio_id,
          telefono: user.telefono || '',
          direccion: user.direccion || '',
          email_adicional: user.email_adicional || '',
        });
    }
  }, [currentUser, open, form, user]);

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/parents/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el padre/tutor.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El padre/tutor ha sido actualizado correctamente.',
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
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Padre/Tutor</DialogTitle>
            <DialogDescription>
              Actualiza los datos del padre o tutor. El email de la cuenta no se puede modificar.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-6">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 py-4">
              {/* Columna de Datos de la Cuenta */}
              <div className="space-y-4">
                  <h4 className="font-semibold text-foreground text-sm">Datos de la Cuenta</h4>
                  <Separator />
                   <div className='space-y-1'>
                      <Label htmlFor="email">Email de Cuenta</Label>
                      <Input id="email" type="email" value={user.email} disabled />
                    </div>
              </div>

              {/* Columna de Datos Personales */}
               <div className="space-y-4">
                  <h4 className="font-semibold text-foreground text-sm">Datos Personales</h4>
                  <Separator />
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-1'>
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input id="nombre" {...form.register('nombre')} />
                        {form.formState.errors.nombre && <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>}
                    </div>
                     <div className='space-y-1'>
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input id="apellido" {...form.register('apellido')} />
                        {form.formState.errors.apellido && <p className="text-sm text-destructive">{form.formState.errors.apellido.message}</p>}
                    </div>
                  </div>
                  <div className='space-y-1'>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" {...form.register('telefono')} />
                    {form.formState.errors.telefono && <p className="text-sm text-destructive">{form.formState.errors.telefono.message}</p>}
                  </div>
                  <div className='space-y-1'>
                    <Label htmlFor="email_adicional">Email Adicional (Opcional)</Label>
                    <Input id="email_adicional" type="email" {...form.register('email_adicional')} />
                    {form.formState.errors.email_adicional && <p className="text-sm text-destructive">{form.formState.errors.email_adicional.message}</p>}
                  </div>
                   <div className='space-y-1'>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input id="direccion" {...form.register('direccion')} />
                    {form.formState.errors.direccion && <p className="text-sm text-destructive">{form.formState.errors.direccion.message}</p>}
                  </div>
                   {(currentUser?.rol === 'master' || currentUser?.rol === 'manager') && (
                     <div className='space-y-1'>
                        <Label htmlFor="colegio_id">Colegio</Label>
                        <Select onValueChange={(value) => form.setValue('colegio_id', value)} value={form.watch('colegio_id') || undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un colegio" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Sin colegio asignado</SelectItem>
                                {colegios.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.colegio_id && <p className="text-sm text-destructive">{form.formState.errors.colegio_id.message}</p>}
                    </div>
                  )}
               </div>
            </div>
          </ScrollArea>
          <DialogFooter className='pt-6'>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
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
