'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  useLoadScript,
  GoogleMap,
  MarkerF,
  PolylineF,
  InfoWindowF,
} from '@react-google-maps/api';
import { Loader2, LocateFixed } from 'lucide-react';
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
import { MapTypeSelector } from './map-type-selector';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';


type MappedBus = TrackedBus & {
  estudiantes_ids: string[];
};

type StaticState = {
  currentTurno: 'Recogida' | 'Entrega';
};

const libraries: ('geometry')[] = ['geometry'];
const mapCenter = { lat: -0.180653, lng: -78.467834 };

const getOffsetPosition = (position: { lat: number; lng: number }, index: number, total: number) => {
    if (total <= 1) {
        return position;
    }
    const offset = 0.00015; 
    const angle = (index / total) * 2 * Math.PI;
    return {
        lat: position.lat + offset * Math.cos(angle),
        lng: position.lng + offset * Math.sin(angle),
    };
};


export default function MiPanelPage() {
    const { user } = useUser();
    const [buses, setBuses] = useState<MappedBus[]>([]);
    const [hijos, setHijos] = useState<(Estudiante & {paradas: Parada[]})[]>([]);
    const [staticStates, setStaticStates] = useState<Record<string, StaticState>>({});
    const [loading, setLoading] = useState(true);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeChildId, setActiveChildId] = useState<string | null>(null);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });
    
    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
        
        const satelliteMapType = new google.maps.ImageMapType({
            getTileUrl: function(coord, zoom) {
                if (!coord || zoom === undefined) return null;
                const tilesPerGlobe = 1 << zoom;
                let x = coord.x % tilesPerGlobe;
                if (x < 0) x = tilesPerGlobe + x;
                const subdomain = ['mt0', 'mt1', 'mt2', 'mt3'][coord.x % 4];
                return `https://${subdomain}.google.com/vt/lyrs=y&x=${x}&y=${coord.y}&z=${zoom}&s=Ga`;
            },
            tileSize: new google.maps.Size(256, 256),
            name: 'Satélite',
            maxZoom: 22
        });

        const trafficMapType = new google.maps.ImageMapType({
            getTileUrl: function(coord, zoom) {
                if (!coord || zoom === undefined) return null;
                const tilesPerGlobe = 1 << zoom;
                let x = coord.x % tilesPerGlobe;
                if (x < 0) x = tilesPerGlobe + x;
                const subdomain = ['mt0', 'mt1', 'mt2', 'mt3'][coord.x % 4];
                return `https://${subdomain}.google.com/vt/lyrs=m@221097413,traffic&x=${x}&y=${coord.y}&z=${zoom}&s=Ga`;
            },
            tileSize: new google.maps.Size(256, 256),
            name: 'Tráfico',
            maxZoom: 22
        });
        
        mapInstance.mapTypes.set("SATELLITE", satelliteMapType);
        mapInstance.mapTypes.set("TRAFFIC", trafficMapType);
    }, []);

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
          const stop = activeChild.paradas.find(p => p.activo);
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

    const hijoStopMarkers = useMemo(() => {
        const stopsMap: Map<string, (Estudiante & {paradas: Parada[]})[]> = new Map();
        
        hijos.forEach(hijo => {
            const stop = hijo.paradas.find(p => p.activo);
            if(stop) {
                const key = `${stop.lat},${stop.lng}`;
                if (!stopsMap.has(key)) {
                    stopsMap.set(key, []);
                }
                stopsMap.get(key)!.push(hijo);
            }
        });

        const markers: {hijo: Estudiante, position: {lat: number, lng: number}, icon: string}[] = [];
        stopsMap.forEach((hijosAtStop, key) => {
            const [lat, lng] = key.split(',').map(Number);
            hijosAtStop.forEach((hijo, index) => {
                const isActive = activeChildId === hijo.id;
                const pinColor = isActive ? '#01C998' : '#0D2C5B';
                const initials = ((hijo.nombre?.[0] || '') + (hijo.apellido?.[0] || '')).toUpperCase();

                const svg = `
                    <svg width="48" height="58" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                        <path fill="${pinColor}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 0 1-35.464 0z"/>
                        <text x="192" y="230" font-family="sans-serif" font-size="160" font-weight="bold" fill="white" text-anchor="middle" dy=".1em">${initials}</text>
                    </svg>
                `.trim();

                markers.push({
                    hijo: hijo,
                    position: getOffsetPosition({ lat, lng }, index, hijosAtStop.length),
                    icon: `data:image/svg+xml;base64,${btoa(svg)}`
                });
            });
        });

        return markers;

    }, [hijos, activeChildId]);
    
    useEffect(() => {
        if(map && mapTypeId) {
            map.setMapTypeId(mapTypeId);
        }
    }, [map, mapTypeId]);

    const locateUser = () => {
        if (!map) return;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    map.panTo(pos);
                    map.setZoom(15);
                    toast({
                        title: 'Ubicación Encontrada',
                        description: 'Mapa centrado en tu ubicación actual.',
                    });
                },
                () => {
                    toast({
                        variant: 'destructive',
                        title: 'Error de Ubicación',
                        description: 'No se pudo acceder a tu ubicación. Asegúrate de tener los permisos activados.',
                    });
                }
            );
        } else {
            toast({
                variant: 'destructive',
                title: 'Navegador no compatible',
                description: 'La geolocalización no es compatible con tu navegador.',
            });
        }
    };


    if (loading || !isLoaded) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4">Cargando mapa...</p></div>;
    }
    if (loadError) {
        return <div className="p-4 text-destructive">Error al cargar el mapa.</div>;
    }
    
    return (
        <div className="h-full w-full relative">
            <GoogleMap
                mapContainerClassName='w-full h-full'
                center={mapCenter}
                zoom={12}
                onLoad={onMapLoad}
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
                
                 {hijoStopMarkers.map(({hijo, position, icon}) => {
                    const isActive = activeChildId === hijo.id;
                    return (
                        <MarkerF
                            key={hijo.id + '_stop'}
                            position={position}
                            icon={{
                                url: icon,
                                scaledSize: new google.maps.Size(48, 58),
                                anchor: new google.maps.Point(24, 58),
                            }}
                            title={`Parada de ${hijo.nombre}`}
                            zIndex={isActive ? 95 : 90}
                            onClick={() => setActiveChildId(hijo.id)}
                        />
                    );
                })}
            </GoogleMap>
            
             <div className="absolute bottom-40 right-4 z-20 flex flex-col gap-2">
                <Button variant="outline" size="icon" className='h-12 w-12 rounded-full bg-background shadow-lg' onClick={locateUser}>
                    <LocateFixed className="h-6 w-6" />
                </Button>
                <MapTypeSelector value={mapTypeId} onChange={setMapTypeId} />
            </div>
            
            {hijos.length > 0 && isMobile && (
                <div className="absolute bottom-20 left-0 right-0 p-4 z-10">
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
