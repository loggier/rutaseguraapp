
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  GoogleMap,
  MarkerF,
  PolylineF,
} from '@react-google-maps/api';
import { Loader2, LocateFixed } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import type { Estudiante, Parada } from '@/lib/types';
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


type StaticState = {
  currentTurno: 'Recogida' | 'Entrega';
};

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
    const { hijos, buses, loading } = useParentDashboard();
    const { isLoaded, loadError } = useGoogleMaps();
    
    const [staticStates, setStaticStates] = useState<Record<string, StaticState>>({});
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeChildId, setActiveChildId] = useState<string | null>(null);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
    const { toast } = useToast();
    const isMobile = useIsMobile();

    
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
            if(hijos[selectedSlide] && hijos[selectedSlide].id !== activeChildId) {
                setActiveChildId(hijos[selectedSlide].id);
            }
        });
    }, [carouselApi, hijos, activeChildId]);
    
    const activeChild = useMemo(() => hijos.find(h => h.id === activeChildId), [hijos, activeChildId]);
    
    const activeBus = useMemo(() => {
        if (!activeChildId) return null;
        const child = hijos.find(h => h.id === activeChildId);
        if (!child || !child.ruta_id) return null;
        return buses.find(b => b.ruta?.id === child.ruta_id);
    }, [activeChildId, hijos, buses]);


    useEffect(() => {
      if (map && activeChild) {
        const stop = activeChild.paradas.find(p => p.activo);
        if (stop) {
          map.panTo({ lat: stop.lat, lng: stop.lng });
        } else if (activeBus && activeBus.ruta.colegio) {
          map.panTo({lat: activeBus.ruta.colegio.lat!, lng: activeBus.ruta.colegio.lng!});
        }
      }
    }, [activeChildId, map, activeBus, activeChild]);


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
                const isActive = activeChildId === hijo.id;
                const position = getOffsetPosition({ lat, lng }, index, hijosAtStop.length);
                
                if (hijo.avatar_url) {
                    const baseSize = 40;
                    const activeSize = 48;
                    const borderWidth = 3;
                    const pinHeight = 10;
                    
                    const avatarSize = isActive ? activeSize : baseSize;
                    const totalSize = avatarSize + (borderWidth * 2);
                    const borderColor = isActive ? '#01C998' : '#A1A1AA';

                    markers.push(
                        <MarkerF
                            key={`${hijo.id}-marker-group`}
                            position={position}
                            icon={{
                                url: hijo.avatar_url,
                                scaledSize: new google.maps.Size(avatarSize, avatarSize),
                                anchor: new google.maps.Point(totalSize / 2, totalSize + pinHeight - borderWidth),
                            }}
                            label={{
                                text: ' ', // Necesario para que el label se renderice
                                className: `
                                    marker-label 
                                    before:content-[''] 
                                    before:absolute 
                                    before:left-1/2 
                                    before:-translate-x-1/2 
                                    before:top-[${avatarSize}px]
                                    before:w-0 before:h-0 
                                    before:border-l-[6px] before:border-l-transparent 
                                    before:border-t-[${pinHeight}px] before:border-t-[${borderColor}]
                                    before:border-r-[6px] before:border-r-transparent
                                `,
                                color: 'white',
                                fontSize: '1px',
                            }}
                            zIndex={isActive ? 95 : 90}
                            onClick={() => {
                                if (activeChildId !== hijo.id) setActiveChildId(hijo.id);
                            }}
                            shape={{
                                coords: [totalSize / 2, totalSize / 2, totalSize / 2],
                                type: 'circle'
                            }}
                        />
                    );
                } else {
                    const pinColor = isActive ? '#01C998' : '#0D2C5B';
                    const initials = ((hijo.nombre?.[0] || '') + (hijo.apellido?.[0] || '')).toUpperCase();
                    const svgContent = `<text x="192" y="230" font-family="sans-serif" font-size="160" font-weight="bold" fill="white" text-anchor="middle" dy=".1em">${initials}</text>`;
                    const svg = `
                        <svg width="48" height="58" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                            <path fill="${pinColor}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 0 1-35.464 0z"/>
                            ${svgContent}
                        </svg>
                    `.trim();
                    const markerIcon = `data:image/svg+xml;base64,${btoa(svg)}`;
                    
                    markers.push(
                         <MarkerF
                            key={hijo.id}
                            position={position}
                            icon={{
                                url: markerIcon,
                                scaledSize: new google.maps.Size(isActive ? 42 : 36, isActive ? 54 : 48),
                                anchor: new google.maps.Point(isActive ? 21 : 18, isActive ? 54 : 48),
                            }}
                            title={`Parada de ${hijo.nombre}`}
                            zIndex={isActive ? 95 : 90}
                            onClick={() => {
                                if (activeChildId !== hijo.id) setActiveChildId(hijo.id);
                            }}
                        />
                    );
                }
            });
        });

        return markers;

    }, [hijos, activeChildId, isLoaded]);
    
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
    
    const handleCardClick = (childId: string, index: number) => {
        setActiveChildId(childId);
        if (carouselApi && carouselApi.selectedScrollSnap() !== index) {
            carouselApi.scrollTo(index);
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
            <style jsx global>{`
                .marker-label {
                    border-radius: 9999px;
                    border: 3px solid #01C998;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    transform: translate(-50%, -50%);
                    background-color: white; /* para el borde interior */
                    padding: 3px; /* Simula el borde */
                }
                .marker-label.active {
                     border-color: #01C998;
                }
                .marker-label.inactive {
                    border: 3px solid #A1A1AA;
                }
                 .marker-label.inactive::before {
                    border-top-color: #A1A1AA !important;
                }
            `}</style>
            <GoogleMap
                mapContainerClassName='w-full h-full'
                center={mapCenter}
                zoom={12}
                onLoad={onMapLoad}
                options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: false }}
            >
                {activeBus && activeBus.ruta.colegio?.lat && activeBus.ruta.colegio?.lng && (
                    <>
                        <PolylineF path={decodedPolylinePath} options={{ strokeColor: '#01C998', strokeWeight: 5, strokeOpacity: 0.8 }}/>
                        
                        <MarkerF 
                            position={{ lat: activeBus.ruta.colegio.lat, lng: activeBus.ruta.colegio.lng }}
                            icon={{
                                url: '/school-icon.png',
                                scaledSize: new google.maps.Size(40, 40),
                                anchor: new google.maps.Point(20, 40),
                            }}
                            title={activeBus.ruta.colegio?.nombre}
                            zIndex={99}
                        />

                        {/* Marcador del Bus */}
                         <MarkerF
                            position={{ lat: activeBus.ruta.colegio.lat, lng: activeBus.ruta.colegio.lng + 0.0005 }}
                            icon={{
                                url: '/bus.png',
                                scaledSize: new google.maps.Size(48, 48),
                                anchor: new google.maps.Point(24, 24),
                            }}
                            title={`Bus: ${activeBus.matricula}`}
                            zIndex={100}
                        />
                    </>
                )}
                
                 {hijoStopMarkers}
            </GoogleMap>
            
             <div className="absolute bottom-56 right-4 z-20 flex flex-col gap-2 md:bottom-4">
                <Button variant="outline" size="icon" className='h-12 w-12 rounded-full bg-background shadow-lg' onClick={locateUser}>
                    <LocateFixed className="h-6 w-6" />
                </Button>
                <MapTypeSelector value={mapTypeId} onChange={setMapTypeId} />
            </div>
            
            {hijos.length > 0 && isMobile && (
                 <div className="absolute bottom-20 left-0 right-0 p-4 z-10 md:hidden">
                    <Carousel setApi={setCarouselApi} opts={{ align: "start" }}>
                        <CarouselContent className="-ml-2">
                        {hijos.map((hijo, index) => (
                            <CarouselItem key={hijo.id} className="pl-4 basis-4/5 md:basis-1/3 lg:basis-1/4">
                               <div onClick={() => handleCardClick(hijo.id, index)}>
                                    <HijoCard 
                                        hijo={hijo} 
                                        bus={buses.find(b => b.ruta?.id === hijo.ruta_id)}
                                        isActive={activeChildId === hijo.id}
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            )}
        </div>
    );
}

    
