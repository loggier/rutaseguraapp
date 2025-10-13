
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
import { createDriver, type State } from './actions';
import type { User, Colegio } from '@/contexts/user-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  licencia: z.string().min(1, 'La licencia es requerida'),
  telefono: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  colegio_id: z.string({ required_error: 'Se debe seleccionar un colegio.' }).uuid('ID de colegio inválido').optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type AddDriverFormProps = {
  user: User;
  colegios: Colegio[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Crear Conductor
    </Button>
  );
}

export function AddDriverForm({ user, colegios }: AddDriverFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const initialState: State = { message: null, errors: {} };
  const createDriverWithUser = createDriver.bind(null, user);
  const [state, formAction] = useActionState(createDriverWithUser, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      licencia: '',
      telefono: '',
      avatar_url: '',
      colegio_id: undefined,
    },
  });

  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.errors || state.message?.startsWith('Error') ? "destructive" : "default",
        title: state.errors || state.message?.startsWith('Error') ? "Error al Crear" : "Éxito",
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
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} name={field.name}>
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
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Apellido *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="licencia"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Nro. de Licencia *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} value={field.value ?? ''} />
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
