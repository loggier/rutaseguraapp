'use client';

import { useEffect, useState, useActionState, useRef, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { updateSchool, type State } from './actions';
import type { Colegio } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useLoadScript, GoogleMap, MarkerF, Autocomplete } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre del colegio es requerido'),
  ruc: z.string().length(13, 'El RUC debe tener 13 dígitos'),
  email_contacto: z.string().email('Email de contacto inválido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  calle: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
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
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: school.nombre || '',
      ruc: school.ruc || '',
      email_contacto: school.email_contacto || '',
      telefono: school.telefono || '',
      direccion: school.direccion || '',
      lat: school.lat || -0.1807,
      lng: school.lng || -78.4678,
      calle: school.calle || '',
      numero: school.numero || '',
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

  const center = { lat: form.watch('lat'), lng: form.watch('lng') };

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]) => {
      let streetNumber = '';
      let route = '';
      for (const component of components) {
        if (component.types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        if (component.types.includes('route')) {
          route = component.long_name;
        }
      }
      form.setValue('calle', route, { shouldValidate: true, shouldDirty: true });
      form.setValue('numero', streetNumber, { shouldValidate: true, shouldDirty: true });
  }

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
        
        if (place.address_components) {
            parseAddressComponents(place.address_components);
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
      
      if (!form.getValues('direccion')) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: newPos }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            form.setValue('direccion', results[0].formatted_address, { shouldValidate: true });
              if(results[0].address_components) {
                  parseAddressComponents(results[0].address_components);
              }
          }
        });
      }
    }
  };

  const renderMap = () => {
    if (loadError) return <div>Error al cargar el mapa.</div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
      <GoogleMap
        mapContainerClassName="h-full w-full rounded-md"
        center={center}
        zoom={15}
        onLoad={onLoad}
        options={{ mapTypeControl: false, streetViewControl: false }}
      >
        <MarkerF position={center} draggable={true} onDragEnd={onMarkerDragEnd} />
      </GoogleMap>
    );
  };

  return (
    <Form {...form}>
      <form action={dispatch} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 py-4">
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

        <Separator/>
        
        <div className="space-y-4">
           <h4 className="font-semibold text-foreground">Ubicación del Colegio</h4>
           <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {isLoaded && (
                        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                           <FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                <FormItem className='space-y-1'>
                                    <Label>Dirección (Autocompletar)</Label>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input {...field} ref={addressInputRef} className="pl-9" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </Autocomplete>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="calle"
                            render={({ field }) => (
                            <FormItem className='space-y-1'>
                                <Label>Calle</Label>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="numero"
                            render={({ field }) => (
                            <FormItem className='space-y-1'>
                                <Label>Número</Label>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div className="h-64 w-full bg-muted rounded-md relative">
                    {renderMap()}
                </div>
           </div>
        </div>

        <input type="hidden" {...form.register('lat')} />
        <input type="hidden" {...form.register('lng')} />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
