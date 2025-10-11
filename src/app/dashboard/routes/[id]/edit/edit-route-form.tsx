'use client';

import { useEffect, useActionState } from 'react';
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
import { updateRoute, type State } from './actions';
import type { User } from '@/contexts/user-context';
import type { Colegio, Ruta } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';


const formSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  hora_salida_manana: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)").optional().or(z.literal('')),
  hora_salida_tarde: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)").optional().or(z.literal('')),
  colegio_id: z.string().uuid().optional(),
}).refine(data => data.hora_salida_manana || data.hora_salida_tarde, {
    message: "Debes especificar al menos una hora de salida.",
    path: ["hora_salida_manana"],
});


type FormValues = z.infer<typeof formSchema>;

type EditRouteFormProps = {
  user: User;
  colegios: Colegio[];
  route: Ruta;
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

export function EditRouteForm({ user, colegios, route }: EditRouteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const initialState: State = { message: null, errors: {} };
  const updateRouteWithParams = updateRoute.bind(null, route.id, user);
  const [state, formAction] = useActionState(updateRouteWithParams, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: route.nombre,
      hora_salida_manana: route.hora_salida_manana || '',
      hora_salida_tarde: route.hora_salida_tarde || '',
      colegio_id: route.colegio_id,
    },
  });

  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.errors || state.message?.startsWith('Error') ? "destructive" : "default",
        title: state.errors || state.message?.startsWith('Error') ? "Error al Actualizar" : "Éxito",
        description: state.message,
      });
    }
    if (state.errors) {
        state.errors.nombre && form.setError('nombre', { message: state.errors.nombre[0] });
        state.errors.hora_salida_manana && form.setError('hora_salida_manana', { message: state.errors.hora_salida_manana[0] });
        state.errors.hora_salida_tarde && form.setError('hora_salida_tarde', { message: state.errors.hora_salida_tarde[0] });
        state.errors.colegio_id && form.setError('colegio_id', { message: state.errors.colegio_id[0] });
    }
  }, [state, toast, form]);

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
                  <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
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
            name="nombre"
            render={({ field }) => (
              <FormItem className='space-y-1 md:col-span-2'>
                <FormLabel>Nombre de la Ruta *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Ruta Norte" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="hora_salida_manana"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Hora de Salida (Mañana)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="hora_salida_tarde"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Hora de Salida (Tarde)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>
                Debes proporcionar al menos una hora de salida. La hora de mañana se usará para el turno de 'Recogida' y la de tarde para el de 'Entrega'.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
