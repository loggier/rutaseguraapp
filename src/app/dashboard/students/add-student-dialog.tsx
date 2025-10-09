'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Estudiante, Profile } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getParentsForSchool } from '@/lib/services/student-services';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  padre_id: z.string().uuid('Debes seleccionar un padre/tutor'),
  avatar_url: z.string().url().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type AddStudentDialogProps = {
  onStudentAdded: (newStudent: Estudiante) => void;
};

export function AddStudentDialog({ onStudentAdded }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [parents, setParents] = useState<Profile[]>([]);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      avatar_url: null,
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
        form.reset();
    }
  }, [open, fetchParents, form]);


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
      onStudentAdded(data.student);
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

  const nombre = form.watch('nombre');
  const apellido = form.watch('apellido');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Agregar Estudiante</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Estudiante</DialogTitle>
            <DialogDescription>
              Completa los datos del estudiante y asigna un padre/tutor.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-4 py-4">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-3xl">
                            {(nombre?.[0] || '')}{(apellido?.[0] || '')}
                        </AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline" disabled>Subir Foto</Button>
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
                <div className='space-y-1'>
                    <Label>Padre/Tutor</Label>
                    <Select onValueChange={(value) => form.setValue('padre_id', value, { shouldValidate: true })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un padre/tutor..." />
                        </SelectTrigger>
                        <SelectContent>
                            {parents.map((parent) => (
                                <SelectItem key={parent.id} value={parent.id}>
                                    {parent.nombre} {parent.apellido} ({parent.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.padre_id && <p className="text-sm text-destructive">{form.formState.errors.padre_id.message}</p>}
                </div>
            </div>
          </ScrollArea>
          <DialogFooter className='pt-6'>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Estudiante
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
