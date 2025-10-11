'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isMapLoading, setIsMapLoading] = useState(true);
  const { toast } = useToast();

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const initMap = useCallback(() => {
    if (!window.google || !window.google.maps) {
        console.error("Google Maps script not loaded");
        setIsMapLoading(false);
        return;
    }
    
    const initialPos = { lat: form.getValues('lat'), lng: form.getValues('lng') };

    const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: initialPos,
      zoom: 15,
      mapTypeControl: false,
    });
    mapRef.current = map;

    const marker = new google.maps.Marker({
      position: initialPos,
      map: map,
      draggable: true,
    });
    markerRef.current = marker;

    marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: pos }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                    form.setValue('direccion', results[0].formatted_address, { shouldValidate: true });
                    form.setValue('lat', pos.lat());
                    form.setValue('lng', pos.lng());
                }
            });
        }
    });

    if (inputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ["formatted_address", "geometry.location"],
        });
        autocompleteRef.current = autocomplete;
        autocomplete.bindTo("bounds", map);
        
        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                map.setCenter(place.geometry.location);
                marker.setPosition(place.geometry.location);
                form.setValue('direccion', place.formatted_address || '', { shouldValidate: true });
                form.setValue('lat', place.geometry.location.lat());
                form.setValue('lng', place.geometry.location.lng());
            }
        });
    }

    setIsMapLoading(false);
  }, [form]);
  
  useEffect(() => {
    if (isOpen) {
        // Delay map init to allow dialog to render
        setTimeout(initMap, 100);
    }
  }, [isOpen, initMap]);
  
  const locateUser = () => {
    if (navigator.geolocation && mapRef.current && markerRef.current) {
        navigator.geolocation.getCurrentPosition((position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            mapRef.current?.setCenter(pos);
            markerRef.current?.setPosition(pos);
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: pos }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                    form.setValue('direccion', results[0].formatted_address, { shouldValidate: true });
                    form.setValue('lat', pos.lat);
                    form.setValue('lng', pos.lng);
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

              <div className="relative">
                <Label htmlFor="direccion">Dirección</Label>
                <div className="flex items-center">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="direccion" {...form.register('direccion')} ref={inputRef} className="pl-9" />
                    <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={locateUser}>
                        <LocateFixed className="h-4 w-4" />
                    </Button>
                </div>
                {form.formState.errors.direccion && <p className="text-sm text-destructive mt-1">{form.formState.errors.direccion.message}</p>}
              </div>

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
                {isMapLoading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                <div id="map" className="h-full w-full rounded-md"></div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Parada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
