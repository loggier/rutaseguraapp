'use client';

import { useEffect, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { updateBus, type State } from './actions';
import type { User, Colegio, Conductor, Ruta, Autobus } from '@/contexts/user-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/lib/supabase/client';

const formSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida'),
  capacidad: z.coerce.number().int().min(1, 'La capacidad debe ser mayor a 0'),
  imei_gps: z.string().min(1, 'El IMEI del GPS es requerido'),
  estado: z.enum(['activo', 'inactivo', 'mantenimiento']),
  colegio_id: z.string({ required_error: 'Se debe seleccionar un colegio.' }).uuid('ID de colegio inválido').optional().nullable(),
  conductor_id: z.string().uuid('ID de conductor inválido').optional().nullable(),
  ruta_id: z.string().uuid('ID de ruta inválido').optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type EditBusFormProps = {
  user: User;
  bus: Autobus;
  colegios: Colegio[];
  allConductores: Conductor[];
  initialRutas: Ruta[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar Cambios
    </Button>
  );
}

export function EditBusForm({ user, bus, colegios, allConductores, initialRutas }: EditBusFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [filteredConductores, setFilteredConductores] = useState<Conductor[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>(initialRutas);
  
  const initialState: State = { message: null, errors: {} };
  const updateBusWithParams = updateBus.bind(null, bus.id, user);
  const [state, formAction] = useActionState(updateBusWithParams, initialState);

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
    async function updateRelatedData() {
      if (!watchedColegioId) {
        setFilteredConductores([]);
        setRutas([]);
        return;
      }
      
      const newFilteredDrivers = allConductores.filter(c => c.colegio_id === watchedColegioId);
      setFilteredConductores(newFilteredDrivers);

      const supabase = createClient();
      const { data: rutasData } = await supabase.from('rutas').select('*').eq('colegio_id', watchedColegioId);
      setRutas(rutasData || []);

      const currentConductorId = form.getValues('conductor_id');
      if (currentConductorId && !newFilteredDrivers.some(c => c.id === currentConductorId)) {
        form.setValue('conductor_id', null, { shouldValidate: true });
      }

      const currentRutaId = form.getValues('ruta_id');
      if (currentRutaId && !rutasData?.some(r => r.id === currentRutaId)) {
        form.setValue('ruta_id', null, { shouldValidate: true });
      }
    }
    updateRelatedData();
  }, [watchedColegioId, allConductores, form]);


  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.errors || state.message?.startsWith('Error') ? "destructive" : "default",
        title: state.errors || state.message?.startsWith('Error') ? "Error al Actualizar" : "Éxito",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <Form {...form}>
      <form
        action={formAction}
        className="space-y-8"
      >
        <div className='grid md:grid-cols-2 gap-6'>
          {(user.rol === 'master' || user.rol === 'manager') && (
            <FormField
              control={form.control}
              name="colegio_id"
              render={({ field }) => (
                <FormItem className='space-y-1 md:col-span-2'>
                  <FormLabel>Colegio *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined} name={field.name}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un colegio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colegios.map((colegio) => (
                        <SelectItem key={colegio.id} value={colegio.id}>{colegio.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="matricula"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Matrícula / Placa *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="capacidad"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Capacidad *</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="imei_gps"
            render={({ field }) => (
              <FormItem className='space-y-1 md:col-span-2'>
                <FormLabel>IMEI del GPS *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Estado *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="conductor_id"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Conductor</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === 'NONE' ? null : value)} value={field.value ?? ''} disabled={!watchedColegioId && user.rol !== 'colegio'}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar conductor" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="NONE">Sin Asignar</SelectItem>
                    {filteredConductores.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="ruta_id"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Ruta Asignada</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === 'NONE' ? null : value)} value={field.value ?? ''} disabled={!watchedColegioId && user.rol !== 'colegio'}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar ruta" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="NONE">Sin Asignar</SelectItem>
                    {rutas.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
