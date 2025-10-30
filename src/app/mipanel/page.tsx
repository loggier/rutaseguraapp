
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  GoogleMap,
  MarkerF,
  PolylineF,
  InfoWindowF,
} from '@react-google-maps/api';
import { Loader2, LocateFixed, Video } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import type { Estudiante, Parada, Ruta, TrackedBus } from '@/lib/types';
import { useParentDashboard, useGoogleMaps } from './layout';
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
import { StudentMarker } from './student-marker';
import { useRouter } from 'next/navigation';


type StaticState = {
  currentTurno: 'Recogida' | 'Entrega';
};

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
    const { hijos, buses, colegio, loading } = useParentDashboard();
    const router = useRouter();
    
    const [staticStates, setStaticStates] = useState<Record<string, StaticState>>({});
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeChildId, setActiveChildId] = useState<string | null>(null);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const { isLoaded, loadError } = useGoogleMaps();
    
    const mapCenter = useMemo(() => {
        if (colegio?.lat && colegio?.lng) {
            return { lat: colegio.lat, lng: colegio.lng };
        }
        return { lat: -0.180653, lng: -78.467834 }; // Fallback
    }, [colegio]);

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
        if (hijos.length > 0 && !activeChildId) {
            setActiveChildId(hijos[0].id);
        }
        
        const initialStates: Record<string, StaticState> = {};
        buses.forEach(bus => {
            if (bus.ruta?.colegio?.lat && bus.ruta?.colegio?.lng) {
                 const currentTurno = bus.ruta.hora_salida_manana ? 'Recogida' : 'Entrega';
                 initialStates[bus.id] = {
                    currentTurno: currentTurno
                };
            }
        });
        setStaticStates(initialStates);

    }, [hijos, buses, activeChildId]);

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
      } else if (map && colegio?.lat && colegio?.lng) {
          map.panTo({ lat: colegio.lat, lng: colegio.lng });
      }
    }, [activeBus, activeChild, map, colegio]);

    const decodedPolylinePath = useMemo(() => {
        if (!isLoaded || !activeBus) return [];
        const state = staticStates[activeBus.id];
        if (!state) return [];

        const optimizedRoute = state.currentTurno === 'Recogida' ? activeBus.ruta.ruta_optimizada_recogida : activeBus.ruta.ruta_optimizada_entrega;
        
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
        if (!isLoaded) return [];
        const stopsMap: Map<string, (Estudiante & {paradas: Parada[], ruta_id?:string})[]> = new Map();
        
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

        const markers: JSX.Element[] = [];
        stopsMap.forEach((hijosAtStop, key) => {
            const [lat, lng] = key.split(',').map(Number);
            hijosAtStop.forEach((hijo, index) => {
                markers.push(
                    <StudentMarker
                        key={hijo.id}
                        hijo={hijo}
                        position={getOffsetPosition({ lat, lng }, index, hijosAtStop.length)}
                        isActive={activeChildId === hijo.id}
                        onClick={() => setActiveChildId(hijo.id)}
                    />
                );
            });
        });

        return markers;

    }, [hijos, activeChildId, isLoaded]);
    
    useEffect(() => {
        if(map && mapTypeId) {
            map.setMapTypeId(mapTypeId);
        }
    }, [map, mapTypeId]);
    
    const colegioMarkerIcon = useMemo(() => {
        if (!isLoaded) return null;

        const size = 48;
        const borderWidth = 3;
        const pinHeight = 8;
        const shadowOffset = 2;
        const width = size + shadowOffset * 2;
        const height = size + pinHeight + shadowOffset * 2;
        const borderColor = '#f44336';
        
        const centerX = width / 2;
        const centerY = size / 2;
        const totalHeight = size + pinHeight;


        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow-colegio" x="0" y="0" width="${width}" height="${height}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="1"/>
                        <feGaussianBlur stdDeviation="1.5"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                    </filter>
                </defs>
                <g filter="url(#shadow-colegio)">
                    <path d="M ${centerX} ${totalHeight} L ${centerX - (pinHeight / 1.5)} ${size} H ${centerX + (pinHeight / 1.5)} Z" fill="${borderColor}" />
                    <circle cx="${centerX}" cy="${centerY}" r="${size / 2}" fill="${borderColor}"/>
                    <circle cx="${centerX}" cy="${centerY}" r="${(size - borderWidth * 2) / 2}" fill="white"/>
                    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${size * 0.5}" font-weight="bold" fill="${borderColor}" dy=".1em">C</text>
                </g>
            </svg>`.trim();

        return {
            url: `data:image/svg+xml;base64,${btoa(svg)}`,
            scaledSize: new google.maps.Size(width, height),
            anchor: new google.maps.Point(centerX, totalHeight - shadowOffset),
        };
    }, [isLoaded]);


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
                zoom={14}
                onLoad={onMapLoad}
                options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: false }}
            >
                {buses.map(bus => {
                    const state = staticStates[bus.id];
                    if (!state || !bus.ruta.colegio?.lat || !bus.ruta.colegio?.lng) return null;
                    const isActive = activeBus?.id === bus.id;
                    const busPosition = {lat: bus.ruta.colegio.lat, lng: bus.ruta.colegio.lng}

                    return (
                        <MarkerF 
                            key={bus.id}
                            position={busPosition}
                            icon={{
                                url: '/bus.png',
                                scaledSize: isActive ? new google.maps.Size(40, 40) : new google.maps.Size(32, 32),
                                anchor: isActive ? new google.maps.Point(20, 20) : new google.maps.Point(16, 16),
                            }}
                            zIndex={isActive ? 100 : 50}
                            onClick={() => router.push('/mipanel/camaras')}
                        />
                    );
                })}

                <MarkerF
                    position={{ lat: -0.157713, lng: -78.454052 }}
                    icon={{
                        url: '/bus.png',
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 16),
                    }}
                    zIndex={50}
                    onClick={() => router.push('/mipanel/camaras')}
                />

                {colegio?.lat && colegio.lng && colegioMarkerIcon && (
                    <MarkerF 
                        position={{ lat: colegio.lat, lng: colegio.lng }}
                        icon={colegioMarkerIcon}
                        title={colegio.nombre}
                        zIndex={1}
                    />
                )}
                
                {activeBus && (
                    <PolylineF path={decodedPolylinePath} options={{ strokeColor: '#01C998', strokeWeight: 5, strokeOpacity: 0.8 }}/>
                )}
                
                 {hijoStopMarkers}
            </GoogleMap>
            
             <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-2 md:bottom-4">
                <Button variant="outline" size="icon" className='h-12 w-12 rounded-full bg-background shadow-lg' onClick={locateUser}>
                    <LocateFixed className="h-6 w-6" />
                </Button>
                <MapTypeSelector value={mapTypeId} onChange={setMapTypeId} />
            </div>
            
            {hijos.length > 0 && isMobile && (
                <div className="absolute bottom-20 left-0 right-0 z-10 md:hidden">
                    <Carousel setApi={setCarouselApi} opts={{ align: "start" }} className="w-full px-4">
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
