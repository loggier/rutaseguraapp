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
import type { Parada } from '@/lib/types';
import { Loader2, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const stopSchema = z.object({
  tipo: z.enum(['Recogida', 'Entrega']),
  sub_tipo: z.enum(['Principal', 'Secundaria']),
  direccion: z.string().min(5, 'La dirección es requerida.'),
  calle: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  lat: z.number(),
  lng: z.number(),
  activo: z.boolean(),
});

type StopFormData = z.infer<typeof stopSchema>;

type EditStopSheetProps = {
  isOpen: boolean;
  parada: Parada | null;
  onClose: (updated?: boolean) => void;
  isLoaded: boolean;
  loadError?: Error;
};

const mapContainerStyle = {
  height: '200px',
  width: '100%',
};

export function EditStopSheet({ isOpen, parada, onClose, isLoaded, loadError }: EditStopSheetProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StopFormData>({
    resolver: zodResolver(stopSchema),
  });

  const { toast } = useToast();
  const [mapCenter, setMapCenter] = useState({ lat: parada?.lat || 0, lng: parada?.lng || 0 });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (parada) {
      reset({
        tipo: parada.tipo,
        sub_tipo: parada.sub_tipo,
        direccion: parada.direccion,
        calle: parada.calle,
        numero: parada.numero,
        lat: parada.lat,
        lng: parada.lng,
        activo: parada.activo,
      });
      setMapCenter({ lat: parada.lat, lng: parada.lng });
    }
  }, [parada, reset]);

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
        setValue('calle', street);
        setValue('numero', number);
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
  
  const locateUser = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setValue('lat', newPos.lat, { shouldValidate: true });
                    setValue('lng', newPos.lng, { shouldValidate: true });
                    setMapCenter(newPos);
                    toast({ title: 'Ubicación encontrada', description: 'El marcador se ha movido a tu ubicación actual.' });
                },
                () => {
                    toast({ variant: 'destructive', title: 'Error de Ubicación', description: 'No se pudo acceder a tu ubicación. Asegúrate de tener los permisos activados.' });
                }
            );
        } else {
             toast({ variant: 'destructive', title: 'Error', description: 'La geolocalización no es compatible con tu navegador.' });
        }
    };

  const onSubmit = async (data: StopFormData) => {
    if (!parada) return;
    try {
        const response = await fetch(`/api/stops/${parada.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ocurrió un error al actualizar la parada.');
        }

        toast({
            title: "Éxito",
            description: "La parada se ha actualizado correctamente.",
        });
        onClose(true); // pass true to indicate an update occurred
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error al Actualizar",
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

             <div className="relative h-[200px] w-full rounded-lg overflow-hidden">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={17}
                    options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                >
                    <MarkerF 
                        position={mapCenter} 
                        draggable={true}
                        onDragEnd={onMarkerDragEnd}
                    />
                </GoogleMap>
                 <Button type="button" size="icon" className="absolute bottom-2 right-2 rounded-full h-10 w-10 shadow-lg" onClick={locateUser}>
                    <LocateFixed className="h-5 w-5" />
                </Button>
            </div>

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
              name="tipo"
              control={control}
              render={({ field }) => (
                <div className="grid gap-2">
                   <Label>Tipo de Parada</Label>
                    <RadioGroup {...field} onValueChange={field.onChange} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Recogida" id="recogida"/>
                            <Label htmlFor="recogida">Recogida</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Entrega" id="entrega" />
                            <Label htmlFor="entrega">Entrega</Label>
                        </div>
                    </RadioGroup>
                </div>
              )}
            />

             <Controller
              name="sub_tipo"
              control={control}
              render={({ field }) => (
                 <div className="grid gap-2">
                   <Label>Sub-tipo de Parada</Label>
                    <RadioGroup {...field} onValueChange={field.onChange} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Principal" id="principal-edit"/>
                            <Label htmlFor="principal-edit">Principal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Secundaria" id="secundaria-edit" />
                            <Label htmlFor="secundaria-edit">Secundaria</Label>
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
                            <Label>Parada Activa</Label>
                            <p className="text-xs text-muted-foreground">
                                Solo una parada de recogida y una de entrega pueden estar activas a la vez.
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
              Guardar Cambios
            </Button>
          </SheetFooter>
        </form>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col" side={ 'bottom' }>
        <SheetHeader className="px-1">
          <SheetTitle>Editar Dirección</SheetTitle>
          <SheetDescription>
            Actualiza los detalles de la parada. Haz clic en guardar cuando termines.
          </SheetDescription>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}
