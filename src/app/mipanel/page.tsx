'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  useLoadScript,
  GoogleMap,
  MarkerF,
  PolylineF,
  InfoWindowF,
} from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import type { Estudiante, Parada, Ruta, TrackedBus } from '@/lib/types';
import { getParentDashboardData } from './actions';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { HijoCard } from './hijo-card';


type MappedBus = TrackedBus & {
  estudiantes_ids: string[];
};

type StaticState = {
  currentTurno: 'Recogida' | 'Entrega';
};


const libraries: ('geometry')[] = ['geometry'];
const mapCenter = { lat: -0.180653, lng: -78.467834 };

export default function MiPanelPage() {
    const { user } = useUser();
    const [buses, setBuses] = useState<MappedBus[]>([]);
    const [hijos, setHijos] = useState<(Estudiante & {paradas: Parada[]})[]>([]);
    const [staticStates, setStaticStates] = useState<Record<string, StaticState>>({});
    const [loading, setLoading] = useState(true);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeChildId, setActiveChildId] = useState<string | null>(null);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    useEffect(() => {
        if (!user?.id) return;
        async function fetchData() {
            setLoading(true);
            const data = await getParentDashboardData(user!.id);
            
            const childrenWithParadas = data.hijos.map(h => ({...h, paradas: h.paradas || []}));
            setHijos(childrenWithParadas);

            const initialStates: Record<string, StaticState> = {};
            const mappedBuses = data.buses.map(bus => {
                if (bus.ruta?.colegio?.lat && bus.ruta?.colegio?.lng) {
                     const currentTurno = bus.ruta.hora_salida_manana ? 'Recogida' : 'Entrega';
                     initialStates[bus.id] = {
                        currentTurno: currentTurno
                    };
                }
                return {
                    ...bus,
                    estudiantes_ids: data.hijos.filter(h => h.ruta_id === bus.ruta?.id).map(h => h.id)
                };
            });
            
            setBuses(mappedBuses);
            setStaticStates(initialStates);
            
            if (data.hijos.length > 0) {
              setActiveChildId(data.hijos[0].id);
            }
            
            setLoading(false);
        }
        fetchData();
    }, [user]);

    useEffect(() => {
        if (!carouselApi) return;
        
        carouselApi.on("select", () => {
            const selectedSlide = carouselApi.selectedScrollSnap();
            if(hijos[selectedSlide]) {
                setActiveChildId(hijos[selectedSlide].id);
            }
        });
    }, [carouselApi, hijos]);
    
    const activeChild = useMemo(() => hijos.find(h => h.id === activeChildId), [hijos, activeChildId]);
    
    const activeBus = useMemo(() => {
        if (!activeChildId) return null;
        const child = hijos.find(h => h.id === activeChildId);
        if (!child || !child.ruta_id) return null;
        return buses.find(b => b.ruta?.id === child.ruta_id);
    }, [activeChildId, hijos, buses]);


    useEffect(() => {
      if (activeBus && map && activeBus.ruta.colegio) {
          map.panTo({lat: activeBus.ruta.colegio.lat!, lng: activeBus.ruta.colegio.lng!});
      } else if (activeChild && map) {
          const stop = activeChild.paradas.find(p => p.activo && p.tipo === 'Recogida');
          if (stop) {
            map.panTo({ lat: stop.lat, lng: stop.lng });
          }
      }
    }, [activeBus, activeChild, map]);

    const decodedPolylinePath = useMemo(() => {
        if (!isLoaded || !activeBus) return [];
        const state = staticStates[activeBus.id];
        if (!state) return [];

        const optimizedRoute = state.currentTurno === 'Recogida' ? activeBus.ruta.ruta_recogida : activeBus.ruta.ruta_entrega;
        
        if (optimizedRoute && typeof optimizedRoute.polyline === 'string' && optimizedRoute.polyline) {
            try {
                return google.maps.geometry.encoding.decodePath(optimizedRoute.polyline);
            } catch (e) {
                console.error("Error decoding polyline: ", e);
            }
        }
        return [];
    }, [isLoaded, activeBus, staticStates]);


    if (loading || !isLoaded) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4">Cargando mapa...</p></div>;
    }
    if (loadError) {
        return <div className="p-4 text-destructive">Error al cargar el mapa.</div>;
    }
    
    const getInitials = (name: string, lastName: string) => `${name?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

    return (
        <div className="h-full w-full relative">
            <GoogleMap
                mapContainerClassName='w-full h-full'
                center={mapCenter}
                zoom={12}
                onLoad={setMap}
                options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: false }}
            >
                {buses.map(bus => {
                    const state = staticStates[bus.id];
                    if (!state || !bus.ruta.colegio?.lat) return null;
                    const isActive = activeBus?.id === bus.id;
                    const busPosition = {lat: bus.ruta.colegio.lat!, lng: bus.ruta.colegio.lng!}

                    return (
                        <MarkerF 
                            key={bus.id}
                            position={busPosition}
                            icon={{
                                url: '/bus.png',
                                scaledSize: new google.maps.Size(isActive ? 33 : 27, isActive ? 40 : 32),
                                anchor: new google.maps.Point(isActive ? 16 : 13, isActive ? 20 : 16),
                            }}
                            zIndex={isActive ? 100 : 50}
                        />
                    );
                })}

                {activeBus && (
                    <>
                        <PolylineF path={decodedPolylinePath} options={{ strokeColor: '#01C998', strokeWeight: 5, strokeOpacity: 0.8 }}/>
                        {activeBus.ruta.colegio?.lat && <MarkerF 
                            position={{ lat: activeBus.ruta.colegio.lat, lng: activeBus.ruta.colegio.lng }}
                            icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#f44336', fillOpacity: 1, strokeWeight: 0 }}
                            label={{ text: 'C', color: 'white', fontWeight: 'bold' }}
                            title={activeBus.ruta.colegio?.nombre}
                        />}
                    </>
                )}
                
                 {hijos.map(hijo => {
                    // Always show the pickup stop
                    const stop = hijo.paradas.find(p => p.activo && p.tipo === 'Recogida');

                    if (!stop) return null;

                    return (
                        <MarkerF
                            key={hijo.id + '_stop'}
                            position={{ lat: stop.lat, lng: stop.lng }}
                            label={{
                                text: getInitials(hijo.nombre, hijo.apellido),
                                color: "white",
                                fontWeight: "bold",
                            }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 12,
                                fillColor: '#6B46C1', // Purple color
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: 'white'
                            }}
                            title={`Parada de ${hijo.nombre}`}
                            zIndex={90}
                        />
                    );
                })}
            </GoogleMap>
            
            {hijos.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <Carousel setApi={setCarouselApi} opts={{ align: "start" }}>
                        <CarouselContent className="-ml-2">
                        {hijos.map((hijo, index) => (
                            <CarouselItem key={hijo.id} className="pl-4 basis-4/5 md:basis-1/3 lg:basis-1/4">
                                <HijoCard 
                                    hijo={hijo} 
                                    bus={buses.find(b => b.ruta?.id === hijo.ruta_id)}
                                    isActive={activeChildId === hijo.id}
                                />
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            )}
        </div>
    );
}
