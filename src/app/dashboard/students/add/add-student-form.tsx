'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/types';
import type { User } from '@/contexts/user-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Select from 'react-select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { createStudent, type State } from './actions';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  padre_id: z.string({ required_error: "Debes seleccionar un padre/tutor."}).uuid('Debes seleccionar un padre/tutor'),
  avatar_url: z.string().url().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type AddStudentFormProps = {
  parents: Profile[];
  user: User;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Crear Estudiante
    </Button>
  );
}

export function AddStudentForm({ parents, user }: AddStudentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const initialState: State = { message: null, errors: {} };
  const [state, dispatch] = useActionState(createStudent, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      avatar_url: null,
      padre_id: undefined,
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.errors) {
        toast({
          variant: "destructive",
          title: "Error de Validación",
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  const nombre = form.watch('nombre');
  const apellido = form.watch('apellido');
  
  const parentOptions = parents.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido} (${p.email})` }));

  return (
    <Form {...form}>
      <form action={dispatch} className="space-y-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-4xl">
              {(nombre?.[0] || '').toUpperCase()}{(apellido?.[0] || '').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button type="button" variant="outline" disabled>Subir Foto</Button>
        </div>
        
        <div className='grid md:grid-cols-2 gap-6'>
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <Label>Nombre *</Label>
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
                <Label>Apellido *</Label>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <Label>Email (Opcional)</Label>
                <FormControl>
                  <Input type="email" {...field} />
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
                <Label>Teléfono (Opcional)</Label>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="padre_id"
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <Label>Padre/Tutor *</Label>
              <FormControl>
                <Select
                  name={field.name}
                  options={parentOptions}
                  value={parentOptions.find(c => c.value === field.value)}
                  onChange={val => field.onChange(val?.value)}
                  placeholder="Selecciona un padre/tutor..."
                  noOptionsMessage={() => "No se encontraron padres/tutores."}
                  classNamePrefix="react-select"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <input type="hidden" name="creador_id" value={user.id} />
        <input type="hidden" name="user_rol" value={user.rol} />
        
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <SubmitButton />
        </div>
      </form>
    </Form>
  );
}