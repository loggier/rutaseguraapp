'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Estudiante, Profile } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getParentsForSchool } from '@/lib/services/student-services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Combobox } from '@/components/ui/combobox';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  padre_id: z.string().uuid('Debes seleccionar un padre/tutor'),
  avatar_url: z.string().url().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type EditStudentDialogProps = {
  student: Estudiante;
  onStudentUpdated: (updatedStudent: Estudiante) => void;
  children: React.ReactNode;
};

export function EditStudentDialog({ student, onStudentUpdated, children }: EditStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [parents, setParents] = useState<Profile[]>([]);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: student.nombre || '',
      apellido: student.apellido || '',
      email: student.email || '',
      telefono: student.telefono || '',
      padre_id: student.padre_id,
      avatar_url: student.avatar_url,
    },
  });

  const fetchParents = useCallback(async () => {
    if (!user) return;
    try {
      const parentData = await getParentsForSchool(user.id, user.rol);
       setParents(parentData);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los padres/tutores.' });
    }
  }, [user, toast]);

  useEffect(() => {
    if (open) {
      fetchParents();
      form.reset({
        nombre: student.nombre || '',
        apellido: student.apellido || '',
        email: student.email || '',
        telefono: student.telefono || '',
        padre_id: student.padre_id,
        avatar_url: student.avatar_url
      });
    }
  }, [open, fetchParents, form, student]);

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el estudiante.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El estudiante ha sido actualizado correctamente.',
      });
      onStudentUpdated(data.student);
      setOpen(false);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-xl"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Editar Estudiante</DialogTitle>
              <DialogDescription>
                Actualiza los datos del estudiante y reasigna su padre/tutor si es necesario.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4 py-4">
                  <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                          <AvatarImage src={student.avatar_url || ''} />
                          <AvatarFallback className="text-3xl">
                              {(student.nombre?.[0] || '')}{(student.apellido?.[0] || '')}
                          </AvatarFallback>
                      </Avatar>
                      <Button type="button" variant="outline" disabled>Cambiar Foto</Button>
                  </div>
                <div className='space-y-1'>
                    <Label>Student ID</Label>
                    <Input value={student.student_id} disabled />
                </div>
                <div className='grid grid-cols-2 gap-4'>
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
                  </div>
                  <div className='space-y-1'>
                      <Label htmlFor="email">Email (Opcional)</Label>
                      <Input id="email" type="email" {...form.register('email')} />
                      {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                  </div>
                  <div className='space-y-1'>
                      <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                      <Input id="telefono" {...form.register('telefono')} />
                      {form.formState.errors.telefono && <p className="text-sm text-destructive">{form.formState.errors.telefono.message}</p>}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="padre_id"
                    render={({ field }) => (
                      <FormItem className='space-y-1'>
                        <Label>Padre/Tutor</Label>
                         <FormControl>
                            <Combobox
                                items={parents.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido} (${p.email})` }))}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Selecciona un padre/tutor..."
                                searchPlaceholder="Buscar padre/tutor..."
                                notFoundMessage="No se encontraron padres/tutores."
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

              </div>
            </ScrollArea>
            <DialogFooter className='pt-6'>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
