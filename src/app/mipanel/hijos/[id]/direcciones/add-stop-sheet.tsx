'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  GoogleMap,
  MarkerF,
  Autocomplete,
} from '@react-google-maps/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const addStopSchema = z.object({
  sub_tipo: z.enum(['Principal', 'Secundaria']),
  direccion: z.string().min(5, 'La dirección es requerida.'),
  calle: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  lat: z.number({ required_error: "La latitud es requerida."}),
  lng: z.number({ required_error: "La longitud es requerida."}),
  activo: z.boolean(),
});

type StopFormData = z.infer<typeof addStopSchema>;

type AddStopSheetProps = {
  isOpen: boolean;
  tipo: 'Recogida' | 'Entrega';
  studentId: string;
  colegioId: string;
  onClose: (created?: boolean) => void;
  isLoaded: boolean;
  loadError?: Error;
};

const mapContainerStyle = {
  height: '200px',
  width: '100%',
  borderRadius: '0.5rem',
};

// Default center (Quito, Ecuador)
const defaultCenter = { lat: -0.180653, lng: -78.467834 };


export function AddStopSheet({ isOpen, tipo, studentId, colegioId, onClose, isLoaded, loadError }: AddStopSheetProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StopFormData>({
    resolver: zodResolver(addStopSchema),
    defaultValues: {
        activo: true,
        sub_tipo: 'Principal',
        direccion: '',
        calle: '',
        numero: '',
    }
  });

  const { toast } = useToast();
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Reset form when the sheet is closed or props change
  useEffect(() => {
    if (!isOpen) {
      reset({
        activo: true,
        sub_tipo: 'Principal',
        direccion: '',
        calle: '',
        numero: '',
        lat: undefined,
        lng: undefined,
      });
      setMapCenter(defaultCenter);
    }
  }, [isOpen, reset]);

  const lat = watch('lat');
  const lng = watch('lng');

  const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setValue('lat', lat, { shouldValidate: true });
        setValue('lng', lng, { shouldValidate: true });
        setValue('direccion', place.formatted_address || '', { shouldValidate: true });
        setMapCenter({ lat, lng });

        let street = '';
        let number = '';
        place.address_components?.forEach(component => {
          if (component.types.includes('route')) {
            street = component.long_name;
          }
          if (component.types.includes('street_number')) {
            number = component.long_name;
          }
        });
        setValue('calle', street, { shouldValidate: true });
        setValue('numero', number, { shouldValidate: true });
      } else {
        toast({
            variant: "destructive",
            title: "Dirección Inválida",
            description: "Por favor, selecciona una dirección válida de la lista.",
        })
      }
    }
  };

   const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setValue('lat', newLat, { shouldValidate: true });
      setValue('lng', newLng, { shouldValidate: true });
      setMapCenter({ lat: newLat, lng: newLng });
    }
  };
  
  const onSubmit = async (data: StopFormData) => {
    try {
        const payload = {
            ...data,
            tipo,
            estudiante_id: studentId,
            colegio_id: colegioId,
        };

        const response = await fetch(`/api/stops`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ocurrió un error al crear la parada.');
        }

        toast({
            title: "Éxito",
            description: "La nueva parada se ha añadido correctamente.",
        });
        onClose(true);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error al Crear",
            description: error.message,
        });
    }
  };

  const renderContent = () => {
    if (loadError) return <div className="p-4 text-center text-destructive">Error al cargar el mapa. Revisa la configuración.</div>;
    if (!isLoaded) return <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-1 py-4 overflow-y-auto">
            
            <div className="grid gap-2">
              <Label htmlFor="direccion">Dirección Autocompletar</Label>
               <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <Input
                  id="direccion"
                  {...register("direccion")}
                  className={errors.direccion ? 'border-destructive' : ''}
                  placeholder="Ej: Av. Principal 123, Quito"
                />
              </Autocomplete>
              {errors.direccion && <p className="text-xs text-destructive">{errors.direccion.message}</p>}
            </div>

             <div className="h-[200px] w-full rounded-lg overflow-hidden">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={lat && lng ? 17 : 12}
                >
                    {lat && lng && (
                        <MarkerF 
                            position={{lat, lng}} 
                            draggable={true}
                            onDragEnd={onMarkerDragEnd}
                        />
                    )}
                </GoogleMap>
            </div>
             {errors.lat && <p className="text-xs text-destructive">{errors.lat.message}</p>}


             <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="calle">Calle</Label>
                <Input id="calle" {...register("calle")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" {...register("numero")} />
              </div>
            </div>

             <Controller
              name="sub_tipo"
              control={control}
              render={({ field }) => (
                 <div className="grid gap-2">
                   <Label>Sub-tipo de Parada</Label>
                    <RadioGroup {...field} onValueChange={field.onChange} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Principal" id="principal-add"/>
                            <Label htmlFor="principal-add">Principal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Secundaria" id="secundaria-add" />
                            <Label htmlFor="secundaria-add">Secundaria</Label>
                        </div>
                    </RadioGroup>
                </div>
              )}
            />

             <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Activar esta parada</Label>
                            <p className="text-xs text-muted-foreground">
                                Si activas esta, se desactivará otra parada activa del mismo tipo.
                            </p>
                        </div>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </div>
                )}
            />
          </div>

          <SheetFooter className="mt-auto pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Parada
            </Button>
          </SheetFooter>
        </form>
    );
  };


  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col" side={'bottom'}>
        <SheetHeader className="px-1">
          <SheetTitle>Añadir Nueva Dirección de {tipo}</SheetTitle>
          <SheetDescription>
            Busca una dirección y completa los detalles. Haz clic en guardar cuando termines.
          </SheetDescription>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}
