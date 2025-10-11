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
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { updateSchool, type State } from './actions';
import type { Colegio } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre del colegio es requerido'),
  ruc: z.string().length(13, 'El RUC debe tener 13 dígitos'),
  email_contacto: z.string().email('Email de contacto inválido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
});

type FormValues = z.infer<typeof formSchema>;

type EditSchoolFormProps = {
  school: Colegio;
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

export function EditSchoolForm({ school }: EditSchoolFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const initialState: State = { message: null, errors: {} };
  const updateSchoolWithId = updateSchool.bind(null, school.id);
  const [state, dispatch] = useActionState(updateSchoolWithId, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: school.nombre || '',
      ruc: school.ruc || '',
      email_contacto: school.email_contacto || '',
      telefono: school.telefono || '',
      direccion: school.direccion || '',
    },
  });

  useEffect(() => {
    if (state.message) {
      toast({
        variant: "destructive",
        title: "Error al Actualizar",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <Form {...form}>
      <form action={dispatch} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8 py-4">
            <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Datos del Colegio</h4>
                <Separator />
                <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                    <FormItem className='space-y-1'>
                        <Label>Nombre del Colegio *</Label>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="ruc"
                    render={({ field }) => (
                    <FormItem className='space-y-1'>
                        <Label>RUC *</Label>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email_contacto"
                    render={({ field }) => (
                    <FormItem className='space-y-1'>
                        <Label>Email de Contacto *</Label>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                    <FormItem className='space-y-1'>
                        <Label>Teléfono *</Label>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="direccion"
                    render={({ field }) => (
                    <FormItem className='space-y-1'>
                        <Label>Dirección *</Label>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Cuenta de Usuario</h4>
                <Separator />
                <div className='space-y-1'>
                    <Label>Email (para inicio de sesión)</Label>
                    <Input value={school.email} disabled />
                </div>
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
