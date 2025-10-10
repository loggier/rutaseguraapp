'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Estudiante } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { updateStudent, type State } from './actions';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type EditStudentFormProps = {
  student: Estudiante;
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

export function EditStudentForm({ student }: EditStudentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const initialState: State = { message: null, errors: {} };
  const updateStudentWithId = updateStudent.bind(null, student.id);
  const [state, dispatch] = useActionState(updateStudentWithId, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: student.nombre || '',
      apellido: student.apellido || '',
      email: student.email || '',
      telefono: student.telefono || '',
      avatar_url: student.avatar_url,
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
        
        <Separator />

        <div className='grid md:grid-cols-2 gap-6'>
            <div className='space-y-1'>
                <Label>Padre/Tutor Asignado</Label>
                <Input value={`${student.padre_nombre} (${student.padre_email})`} disabled />
            </div>
             <div className='space-y-1'>
                <Label>Colegio</Label>
                <Input value={student.colegio_nombre} disabled />
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
