'use client';

import { useState, useEffect } from 'react';
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
import type { Profile, Colegio } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  colegio_id: z.string({ required_error: 'Debes seleccionar un colegio.' }).uuid().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type AddParentDialogProps = {
  onParentAdded: (newParent: Profile) => void;
};

export function AddParentDialog({ onParentAdded }: AddParentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      colegio_id: undefined,
    },
  });

  useEffect(() => {
    async function fetchColegios() {
      if (user?.rol === 'master' || user?.rol === 'manager') {
        const supabase = createClient();
        const { data } = await supabase.from('colegios_view').select('*').order('nombre');
        setColegios(data || []);
      }
    }
    if (open) {
        fetchColegios();
        form.reset(); // Reset form when opening
    }
  }, [user, open, form]);
  
  useEffect(() => {
      async function setColegioForUser() {
        if(user?.rol === 'colegio') {
            const supabase = createClient();
            const { data } = await supabase.from('colegios').select('id').eq('usuario_id', user.id).single();
            if(data?.id) {
                form.setValue('colegio_id', data.id);
            }
        }
      }
      if(open) {
          setColegioForUser();
      }
  }, [user, open, form])

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      // For 'colegio' role, ensure colegio_id is set from their context.
      const finalValues = { ...values };
      if (user?.rol === 'colegio' && !finalValues.colegio_id) {
          const supabase = createClient();
          const { data: currentColegio } = await supabase.from('colegios').select('id').eq('usuario_id', user.id).single();
          if (currentColegio?.id) {
              finalValues.colegio_id = currentColegio.id;
          } else {
              throw new Error("No se pudo determinar el colegio para el usuario actual.");
          }
      }
        
      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalValues),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el padre/tutor.');
      }
      
      toast({
        title: 'Éxito',
        description: 'El padre/tutor ha sido creado correctamente.',
      });
      onParentAdded(data.user);
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
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Agregar Padre/Tutor</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Padre/Tutor</DialogTitle>
            <DialogDescription>
              Completa los campos para registrar un nuevo padre o tutor en el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <div className='space-y-1'>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className='space-y-1'>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
             {(user?.rol === 'master' || user?.rol === 'manager') && (
                 <div className='space-y-1'>
                    <Label htmlFor="colegio_id">Colegio</Label>
                    <Select onValueChange={(value) => form.setValue('colegio_id', value)} value={form.watch('colegio_id') || undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un colegio" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Sin colegio asignado</SelectItem>
                            {colegios.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.colegio_id && <p className="text-sm text-destructive">{form.formState.errors.colegio_id.message}</p>}
                </div>
             )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Padre/Tutor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
