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
import { createRoute, type State } from './actions';
import type { User } from '@/contexts/user-context';
import type { Colegio } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const formSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  turno: z.enum(['Recogida', 'Entrega'], { required_error: 'Debes seleccionar un turno.' }),
  hora_salida: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)"),
  colegio_id: z.string().uuid().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AddRouteFormProps = {
  user: User;
  colegios: Colegio[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Crear Ruta
    </Button>
  );
}

export function AddRouteForm({ user, colegios }: AddRouteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const initialState: State = { message: null, errors: {} };
  const createRouteWithUser = createRoute.bind(null, user);
  const [state, formAction] = useActionState(createRouteWithUser, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      turno: undefined,
      hora_salida: '07:00',
      colegio_id: undefined,
    },
  });

  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.errors || state.message?.startsWith('Error') ? "destructive" : "default",
        title: state.errors || state.message?.startsWith('Error') ? "Error al Crear Ruta" : "Éxito",
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormItem className='space-y-1'>
                <FormLabel>Nombre de la Ruta *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Ruta Norte Mañana" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="turno"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Turno *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un turno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Recogida">Recogida (Mañana)</SelectItem>
                    <SelectItem value="Entrega">Entrega (Tarde)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hora_salida"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Hora de Salida *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
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
