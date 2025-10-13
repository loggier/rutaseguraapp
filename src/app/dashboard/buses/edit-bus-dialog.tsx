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
import type { Autobus, Colegio, Conductor, Ruta } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida'),
  capacidad: z.coerce.number().int().min(1, 'La capacidad debe ser mayor a 0'),
  imei_gps: z.string().min(1, 'El IMEI del GPS es requerido'),
  estado: z.enum(['activo', 'inactivo', 'mantenimiento'], { required_error: 'El estado es requerido.'}),
  colegio_id: z.string().uuid('ID de colegio inválido').optional().nullable(),
  conductor_id: z.string().uuid('ID de conductor inválido').optional().nullable(),
  ruta_id: z.string().uuid('ID de ruta inválido').optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type EditBusDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onBusUpdated: (updatedBus: Autobus) => void;
  user: User;
  bus: Autobus;
};

export function EditBusDialog({ isOpen, onClose, onBusUpdated, user, bus }: EditBusDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricula: bus.matricula,
      capacidad: bus.capacidad,
      imei_gps: bus.imei_gps,
      estado: bus.estado,
      colegio_id: bus.colegio_id,
      conductor_id: bus.conductor_id,
      ruta_id: bus.ruta_id,
    },
  });
  
  const watchedColegioId = form.watch('colegio_id');

  useEffect(() => {
    async function fetchInitialData() {
      if (!isOpen || !user) return;
      const supabase = createClient();
      
      if (user.rol === 'master' || user.rol === 'manager') {
        const { data } = await supabase.from('colegios_view').select('*').order('nombre');
        setColegios(data || []);
      }
    }
    fetchInitialData();
  }, [isOpen, user]);
  
  useEffect(() => {
      async function fetchColegioSubData() {
          if(!watchedColegioId) {
              setConductores([]);
              setRutas([]);
              return;
          };
          const supabase = createClient();
          const { data: conductoresData } = await supabase.from('conductores').select('*').eq('colegio_id', watchedColegioId);
          setConductores(conductoresData || []);
          const { data: rutasData } = await supabase.from('rutas').select('*').eq('colegio_id', watchedColegioId);
          setRutas(rutasData || []);
      }
      
      if(isOpen) {
        form.reset({
          matricula: bus.matricula,
          capacidad: bus.capacidad,
          imei_gps: bus.imei_gps,
          estado: bus.estado,
          colegio_id: bus.colegio_id,
          conductor_id: bus.conductor_id,
          ruta_id: bus.ruta_id,
        });

        if(watchedColegioId) {
            fetchColegioSubData();
        }
      }
  }, [isOpen, user, watchedColegioId, form, bus]);

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/buses/${bus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busData: values, user }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el autobús.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El autobús ha sido actualizado correctamente.',
      });
      onBusUpdated(data.bus);
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
            <DialogTitle>Editar Autobús</DialogTitle>
            <DialogDescription>
              Actualiza los datos del autobús.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 pr-6 -mr-6">
          <div className="grid gap-4 py-4">
              {(user.rol === 'master' || user.rol === 'manager') && (
                <div className='space-y-1'>
                    <Label htmlFor="colegio_id">Colegio</Label>
                    <Select onValueChange={(value) => form.setValue('colegio_id', value)} value={form.watch('colegio_id') || undefined}>
                        <SelectTrigger><SelectValue placeholder="Selecciona un colegio" /></SelectTrigger>
                        <SelectContent>
                            {colegios.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.colegio_id && <p className="text-sm text-destructive">{form.formState.errors.colegio_id.message}</p>}
                </div>
              )}
             <div className='space-y-1'>
                <Label htmlFor="matricula">Matrícula / Placa</Label>
                <Input id="matricula" {...form.register('matricula')} />
                {form.formState.errors.matricula && <p className="text-sm text-destructive">{form.formState.errors.matricula.message}</p>}
              </div>
              <div className='space-y-1'>
                <Label htmlFor="capacidad">Capacidad</Label>
                <Input id="capacidad" type="number" {...form.register('capacidad')} />
                {form.formState.errors.capacidad && <p className="text-sm text-destructive">{form.formState.errors.capacidad.message}</p>}
              </div>
               <div className='space-y-1'>
                <Label htmlFor="imei_gps">IMEI del GPS</Label>
                <Input id="imei_gps" {...form.register('imei_gps')} />
                {form.formState.errors.imei_gps && <p className="text-sm text-destructive">{form.formState.errors.imei_gps.message}</p>}
              </div>
               <div className='space-y-1'>
                  <Label htmlFor="estado">Estado</Label>
                  <Select onValueChange={(value) => form.setValue('estado', value as FormValues['estado'])} value={form.watch('estado')}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                          <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      </SelectContent>
                  </Select>
                  {form.formState.errors.estado && <p className="text-sm text-destructive">{form.formState.errors.estado.message}</p>}
              </div>
              <div className='space-y-1'>
                    <Label htmlFor="conductor_id">Conductor</Label>
                    <Select onValueChange={(value) => form.setValue('conductor_id', value === 'NONE' ? null : value)} value={form.watch('conductor_id') || ''} disabled={!watchedColegioId}>
                        <SelectTrigger><SelectValue placeholder={conductores.length > 0 ? "Selecciona un conductor" : "Sin conductores"} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">Sin conductor asignado</SelectItem>
                            {conductores.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className='space-y-1'>
                    <Label htmlFor="ruta_id">Ruta Asignada</Label>
                    <Select onValueChange={(value) => form.setValue('ruta_id', value === 'NONE' ? null : value)} value={form.watch('ruta_id') || ''} disabled={!watchedColegioId}>
                        <SelectTrigger><SelectValue placeholder={rutas.length > 0 ? "Selecciona una ruta" : "Sin rutas"} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">Sin ruta asignada</SelectItem>
                            {rutas.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
          </div>
          </ScrollArea>
          <DialogFooter className='pt-6'>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
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
