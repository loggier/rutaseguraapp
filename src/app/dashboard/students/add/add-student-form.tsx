'use client';

import { useState } from 'react';
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

export function AddStudentForm({ parents, user }: AddStudentFormProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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

  const onSubmit = async (values: FormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear un estudiante.' });
        return;
    }
    
    setIsPending(true);
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, creador_id: user.id, user_rol: user.rol }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el estudiante.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El estudiante ha sido creado correctamente.',
      });
      router.push('/dashboard/students');

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

  const nombre = form.watch('nombre');
  const apellido = form.watch('apellido');
  
  const parentOptions = parents.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido} (${p.email})` }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-4xl">
              {(nombre?.[0] || '')}{(apellido?.[0] || '')}
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
        
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Estudiante
          </Button>
        </div>
      </form>
    </Form>
  );
}