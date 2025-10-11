'use client';

import { useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Estudiante, Parada } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLoadScript, GoogleMap, MarkerF, Autocomplete } from '@react-google-maps/api';

const libraries: "places"[] = ["places"];

const formSchema = z.object({
  tipo: z.enum(['Recogida', 'Entrega'], { required_error: 'El tipo es requerido.' }),
  direccion: z.string().min(1, 'La dirección es requerida'),
  lat: z.number(),
  lng: z.number(),
  activo: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type StopFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  student: Estudiante;
  stop: Parada | null;
  onStopSaved: (savedStop: Parada) => void;
  availableStopTypes: { canAddRecogida: boolean, canAddEntrega: boolean };
};

export function StopFormDialog({ isOpen, onClose, student, stop, onStopSaved, availableStopTypes }: StopFormDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCGs-R3i-srnJbVTXf6zlIAqxXC1BTTjrA",
    libraries,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: stop?.tipo || (availableStopTypes.canAddRecogida ? 'Recogida' : 'Entrega'),
      direccion: stop?.direccion || '',
      lat: stop?.lat || -0.1807, // Default to Quito
      lng: stop?.lng || -78.4678,
      activo: stop?.activo === undefined ? !student.paradas?.some(p => p.activo) : stop.activo,
    },
  });

  const center = { lat: form.watch('lat'), lng: form.watch('lng') };

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        form.setValue('lat', newPos.lat);
        form.setValue('lng', newPos.lng);
        form.setValue('direccion', place.formatted_address || '', { shouldValidate: true });
        if (addressInputRef.current) {
          addressInputRef.current.value = place.formatted_address || '';
        }
        map?.panTo(newPos);
      }
    }
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      form.setValue('lat', newPos.lat);
      form.setValue('lng', newPos.lng);
      
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: newPos }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          form.setValue('direccion', results[0].formatted_address, { shouldValidate: true });
            if (addressInputRef.current) {
                addressInputRef.current.value = results[0].formatted_address;
            }
        }
      });
    }
  };
  
  const locateUser = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            form.setValue('lat', pos.lat);
            form.setValue('lng', pos.lng);
            map?.panTo(pos);
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: pos }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                    form.setValue('direccion', results[0].formatted_address, { shouldValidate: true });
                    if (addressInputRef.current) {
                        addressInputRef.current.value = results[0].formatted_address;
                    }
                }
            });
        }, () => {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener tu ubicación.' });
        });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const url = stop ? `/api/stops/${stop.id}` : '/api/stops';
      const method = stop ? 'PUT' : 'POST';

      const body = stop 
        ? JSON.stringify(values)
        : JSON.stringify({ ...values, estudiante_id: student.id, colegio_id: student.colegio_id });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast({ title: 'Éxito', description: data.message });
      onStopSaved(data.stop);
      onClose();

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsPending(false);
    }
  };

  const renderMap = () => {
    if (loadError) return <div>Error al cargar el mapa.</div>;
    if (!isLoaded) return <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
      <GoogleMap
        mapContainerClassName="h-full w-full rounded-md"
        center={center}
        zoom={15}
        onLoad={onMapLoad}
        options={{ mapTypeControl: false, streetViewControl: false }}
      >
        <MarkerF position={center} draggable={true} onDragEnd={onMarkerDragEnd} />
      </GoogleMap>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl" onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{stop ? 'Editar Parada' : 'Agregar Nueva Parada'}</DialogTitle>
            <DialogDescription>
              Usa el mapa y el buscador para encontrar la dirección exacta. Puedes arrastrar el marcador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
               <Controller
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <div>
                      <Label>Tipo de Parada</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!stop}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStopTypes.canAddRecogida || stop?.tipo === 'Recogida' ? <SelectItem value="Recogida">Recogida</SelectItem> : null}
                          {availableStopTypes.canAddEntrega || stop?.tipo === 'Entrega' ? <SelectItem value="Entrega">Entrega</SelectItem> : null}
                        </SelectContent>
                      </Select>
                       {form.formState.errors.tipo && <p className="text-sm text-destructive mt-1">{form.formState.errors.tipo.message}</p>}
                    </div>
                  )}
                />

              {isLoaded && (
                <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                >
                  <div className="relative">
                    <Label htmlFor="direccion">Dirección</Label>
                    <div className="flex items-center">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-2" />
                        <Input 
                            id="direccion"
                            ref={addressInputRef}
                            defaultValue={form.getValues('direccion')}
                            className="pl-9"
                         />
                        <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 mt-2" onClick={locateUser}>
                            <LocateFixed className="h-4 w-4" />
                        </Button>
                    </div>
                    {form.formState.errors.direccion && <p className="text-sm text-destructive mt-1">{form.formState.errors.direccion.message}</p>}
                  </div>
                </Autocomplete>
              )}


              <div className="flex items-center space-x-2">
                <Controller
                    control={form.control}
                    name="activo"
                    render={({ field }) => <Switch id="activo" checked={field.value} onCheckedChange={field.onChange} />}
                />
                <Label htmlFor="activo">Marcar como parada activa</Label>
              </div>
               <p className="text-xs text-muted-foreground">Solo una parada (Recogida o Entrega) puede estar activa a la vez para un estudiante.</p>

            </div>
            <div className="h-80 w-full bg-muted rounded-md relative">
                {renderMap()}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !isLoaded}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Parada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
