'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/contexts/user-context';
import type { Conductor, Colegio } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
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
  licencia: z.string().min(1, 'La licencia es requerida'),
  telefono: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  colegio_id: z.string({required_error: 'Se debe seleccionar un colegio.'}).uuid('ID de colegio inválido').optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type AddDriverDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onDriverAdded: (newDriver: Conductor) => void;
  user: User;
};

export function AddDriverDialog({ isOpen, onClose, onDriverAdded, user }: AddDriverDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  
  const [colegios, setColegios] = useState<Colegio[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      licencia: '',
      telefono: '',
      avatar_url: '',
      colegio_id: null,
    },
  });

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return;
      
      form.reset({
        nombre: '',
        apellido: '',
        licencia: '',
        telefono: '',
        avatar_url: '',
        colegio_id: null,
      });
      
      const supabase = createClient();
      
      if (user.rol === 'master' || user.rol === 'manager') {
        const { data } = await supabase.from('colegios_view').select('*').order('nombre');
        setColegios(data || []);
      } else if (user.rol === 'colegio') {
        const { data: colegioData } = await supabase.from('colegios').select('id').eq('usuario_id', user.id).single();
        if (colegioData) {
          form.setValue('colegio_id', colegioData.id);
        }
      }
    }

    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, user, form]);
  
  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverData: values, user }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el conductor.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El conductor ha sido creado correctamente.',
      });
      onDriverAdded(data.driver);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Conductor</DialogTitle>
            <DialogDescription>
              Completa los campos para registrar un nuevo conductor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              {(user.rol === 'master' || user.rol === 'manager') && (
                <div className='space-y-1'>
                    <Label htmlFor="colegio_id">Colegio</Label>
                    <Select onValueChange={(value) => form.setValue('colegio_id', value)} value={form.watch('colegio_id') || ''}>
                        <SelectTrigger><SelectValue placeholder="Selecciona un colegio" /></SelectTrigger>
                        <SelectContent>
                            {colegios.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.colegio_id && <p className="text-sm text-destructive">{form.formState.errors.colegio_id.message}</p>}
                </div>
              )}
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
               <div className='space-y-1'>
                <Label htmlFor="licencia">Nro. de Licencia</Label>
                <Input id="licencia" {...form.register('licencia')} />
                {form.formState.errors.licencia && <p className="text-sm text-destructive">{form.formState.errors.licencia.message}</p>}
              </div>
              <div className='space-y-1'>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" type="tel" {...form.register('telefono')} />
                {form.formState.errors.telefono && <p className="text-sm text-destructive">{form.formState.errors.telefono.message}</p>}
              </div>
          </div>
          <DialogFooter className='pt-6'>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Conductor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
