'use client';

import { useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Estudiante, Parada } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';


const reportIncidenceSchema = z.object({
  tipo_solicitud: z.enum(['video', 'imagen', 'general'], { required_error: 'Debes seleccionar un tipo de solicitud.'}),
  fecha_incidente_date: z.date({ required_error: 'La fecha del incidente es requerida.' }),
  fecha_incidente_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "El formato de hora debe ser HH:MM."),
  observacion: z.string().min(10, 'La observación debe tener al menos 10 caracteres.').max(500, 'La observación no puede superar los 500 caracteres.'),
});

type ReportIncidenceFormData = z.infer<typeof reportIncidenceSchema>;

type ReportIncidenceSheetProps = {
  isOpen: boolean;
  onClose: (reported?: boolean) => void;
  student: Estudiante & { padre_id: string };
};

export function ReportIncidenceSheet({ isOpen, onClose, student }: ReportIncidenceSheetProps) {
  const { user } = useUser();
  const { toast } = useToast();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportIncidenceFormData>({
    resolver: zodResolver(reportIncidenceSchema),
    defaultValues: {
        tipo_solicitud: 'general',
        fecha_incidente_date: new Date(),
        fecha_incidente_time: format(new Date(), 'HH:mm'),
        observacion: '',
    }
  });

  useEffect(() => {
    if (!isOpen) {
      reset({
        tipo_solicitud: 'general',
        fecha_incidente_date: new Date(),
        fecha_incidente_time: format(new Date(), 'HH:mm'),
        observacion: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: ReportIncidenceFormData) => {
    if (!user || !student) return;
    
    const { fecha_incidente_date, fecha_incidente_time } = data;
    const [hours, minutes] = fecha_incidente_time.split(':').map(Number);
    const fecha_incidente = new Date(fecha_incidente_date);
    fecha_incidente.setHours(hours, minutes);

    try {
        const payload = {
            ...data,
            fecha_incidente: fecha_incidente.toISOString(),
            estudiante_id: student.id,
            padre_id: student.padre_id,
            colegio_id: student.colegio_id,
        };

        const response = await fetch('/api/incidencias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ocurrió un error al enviar el reporte.');
        }

        toast({
            title: "Reporte Enviado",
            description: "Tu incidencia ha sido registrada y será revisada pronto.",
        });
        onClose(true);

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error al Reportar",
            description: error.message,
        });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col" side={'bottom'}>
        <SheetHeader className="px-1">
          <SheetTitle>Reportar Incidencia</SheetTitle>
          <SheetDescription>
            Completa el formulario para reportar una incidencia sobre {student.nombre}.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 space-y-4 px-1 py-4 overflow-y-auto">
                <Controller
                    name="tipo_solicitud"
                    control={control}
                    render={({ field }) => (
                        <div className="grid gap-2">
                        <Label>Tipo de Solicitud</Label>
                        <RadioGroup {...field} onValueChange={field.onChange} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="general" id="general"/>
                                <Label htmlFor="general">Reporte General</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="video" id="video"/>
                                <Label htmlFor="video">Solicitar Video</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="imagen" id="imagen" />
                                <Label htmlFor="imagen">Solicitar Imagen</Label>
                            </div>
                        </RadioGroup>
                         {errors.tipo_solicitud && <p className="text-xs text-destructive">{errors.tipo_solicitud.message}</p>}
                        </div>
                    )}
                />

                <div className="space-y-4">
                     <Controller
                        name="fecha_incidente_date"
                        control={control}
                        render={({ field }) => (
                            <div className="grid gap-2">
                                <Label>Fecha del Incidente</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                 {errors.fecha_incidente_date && <p className="text-xs text-destructive">{errors.fecha_incidente_date.message}</p>}
                            </div>
                        )}
                    />
                    <div className="grid gap-2">
                         <Label htmlFor="fecha_incidente_time">Hora (24h)</Label>
                         <Input
                            id="fecha_incidente_time"
                            type="time"
                            {...register("fecha_incidente_time")}
                            className={errors.fecha_incidente_time ? 'border-destructive' : ''}
                         />
                         {errors.fecha_incidente_time && <p className="text-xs text-destructive">{errors.fecha_incidente_time.message}</p>}
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="observacion">Observación o Detalle</Label>
                    <Textarea 
                        id="observacion"
                        {...register("observacion")}
                        placeholder="Describe detalladamente lo que sucedió, por favor incluye la mayor cantidad de información posible."
                        className={cn("min-h-[120px]", errors.observacion ? 'border-destructive' : '')}
                    />
                    {errors.observacion && <p className="text-xs text-destructive">{errors.observacion.message}</p>}
                </div>
            </div>

            <SheetFooter className="mt-auto pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onClose()}>
                Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Reporte
                </Button>
            </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
