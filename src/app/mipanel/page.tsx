
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  GoogleMap,
  PolylineF,
  InfoWindowF,
} from '@react-google-maps/api';
import { Loader2, LocateFixed, Video, User } from 'lucide-react';
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
import { BusMarker } from './bus-marker';
import { MarkerF } from '@react-google-maps/api';
import { MultiVideoPlayerModal } from './camaras/video-player-modal';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    const { hijos, buses, colegio, loading, activeChildId, setActiveChildId } = useParentDashboard();
    const router = useRouter();
    
    const [staticStates, setStaticStates] = useState<Record<string, StaticState>>({});
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeBusId, setActiveBusId] = useState<string | null>(null);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const [mapCenter, setMapCenter] = useState({ lat: -0.180653, lng: -78.467834 });
    const [isCenterSet, setIsCenterSet] = useState(false);

    // Video Modal State
    const [busForVideo, setBusForVideo] = useState<TrackedBus | null>(null);
    const [isPreparingStreams, setIsPreparingStreams] = useState(false);
    const [streamUrls, setStreamUrls] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { isLoaded, loadError } = useGoogleMaps();
    
    const busIcon = useMemo(() => {
        if (!isLoaded) return undefined;
        const busIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#0D2C5B"><path d="M59.9 16.8h-5.2V13c0-2.6-2.1-4.7-4.7-4.7H14c-2.6 0-4.7 2.1-4.7 4.7v3.8H4.1c-2.3 0-4.1 1.8-4.1 4.1v17.4c0 2.3 1.8 4.1 4.1 4.1h2.2c.4 3.7 3.5 6.6 7.3 6.6s6.9-2.9 7.3-6.6h18.2c.4 3.7 3.5 6.6 7.3 6.6s6.9-2.9 7.3-6.6h2.2c2.3 0 4.1-1.8 4.1-4.1V20.9c0-2.2-1.8-4.1-4.1-4.1zM13.6 46.1c-2.6 0-4.7-2.1-4.7-4.7s2.1-4.7 4.7-4.7 4.7 2.1 4.7 4.7-2.1 4.7-4.7 4.7zm36.8 0c-2.6 0-4.7-2.1-4.7-4.7s2.1-4.7 4.7-4.7 4.7 2.1 4.7 4.7-2.1 4.7-4.7 4.7zM57.1 33H6.9V20.9h50.2V33z"/></svg>`;
        return {
            url: `data:image/svg+xml;base64,${btoa(busIconSvg)}`,
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
        };
    }, [isLoaded]);

    const activeBusIcon = useMemo(() => {
        if (!isLoaded) return undefined;
        const busIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#01C998"><path d="M59.9 16.8h-5.2V13c0-2.6-2.1-4.7-4.7-4.7H14c-2.6 0-4.7 2.1-4.7 4.7v3.8H4.1c-2.3 0-4.1 1.8-4.1 4.1v17.4c0 2.3 1.8 4.1 4.1 4.1h2.2c.4 3.7 3.5 6.6 7.3 6.6s6.9-2.9 7.3-6.6h18.2c.4 3.7 3.5 6.6 7.3 6.6s6.9-2.9 7.3-6.6h2.2c2.3 0 4.1-1.8 4.1-4.1V20.9c0-2.2-1.8-4.1-4.1-4.1zM13.6 46.1c-2.6 0-4.7-2.1-4.7-4.7s2.1-4.7 4.7-4.7 4.7 2.1 4.7 4.7-2.1 4.7-4.7 4.7zm36.8 0c-2.6 0-4.7-2.1-4.7-4.7s2.1-4.7 4.7-4.7 4.7 2.1 4.7 4.7-2.1 4.7-4.7 4.7zM57.1 33H6.9V20.9h50.2V33z"/></svg>`;
        return {
            url: `data:image/svg+xml;base64,${btoa(busIconSvg)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
        };
    }, [isLoaded]);

    useEffect(() => {
        if (colegio?.lat && colegio?.lng && !isCenterSet) {
            setMapCenter({ lat: colegio.lat, lng: colegio.lng });
            setIsCenterSet(true);
        }
    }, [colegio, isCenterSet]);

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

    }, [buses]);

    useEffect(() => {
        if (!carouselApi) return;
        
        carouselApi.on("select", () => {
            const selectedSlide = carouselApi.selectedScrollSnap();
            if(hijos[selectedSlide]) {
                setActiveChildId(hijos[selectedSlide].id);
            }
        });

        // Sync carousel with activeChildId
        const activeChildIndex = hijos.findIndex(h => h.id === activeChildId);
        if (activeChildIndex !== -1 && activeChildIndex !== carouselApi.selectedScrollSnap()) {
            carouselApi.scrollTo(activeChildIndex);
        }

    }, [carouselApi, hijos, activeChildId, setActiveChildId]);
    
    const activeChild = useMemo(() => hijos.find(h => h.id === activeChildId), [hijos, activeChildId]);
    
    const selectedBusForInfoWindow = useMemo(() => {
        if (!activeBusId) return null;
        const bus = buses.find(b => b.id === activeBusId);
        if(bus?.last_latitude == null || bus?.last_longitude == null) return null;
        
        return {
            ...bus,
            position: {lat: bus.last_latitude, lng: bus.last_longitude}
        }
    }, [activeBusId, buses]);


    const decodedPolylinePath = useMemo(() => {
        if (!isLoaded || !selectedBusForInfoWindow || !selectedBusForInfoWindow.ruta) return [];
        const state = staticStates[selectedBusForInfoWindow.id];
        if (!state) return [];

        const optimizedRoute = state.currentTurno === 'Recogida' ? selectedBusForInfoWindow.ruta.ruta_optimizada_recogida : selectedBusForInfoWindow.ruta.ruta_optimizada_entrega;
        
        if (optimizedRoute && typeof optimizedRoute.polyline === 'string' && optimizedRoute.polyline) {
            try {
                return google.maps.geometry.encoding.decodePath(optimizedRoute.polyline);
            } catch (e) {
                console.error("Error decoding polyline: ", e);
            }
        }
        return [];
    }, [isLoaded, selectedBusForInfoWindow, staticStates]);

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

    }, [hijos, activeChildId, isLoaded, setActiveChildId]);
    
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

    const handleBusClick = (busId: string) => {
        setActiveBusId(currentId => currentId === busId ? null : busId);
    };

    const handleWatchAllCameras = async (bus: TrackedBus) => {
        if (!bus.imei_gps) return;
        
        setActiveBusId(null); // Close info window
        const channels = bus.video_channels || 1;

        setBusForVideo(bus);
        setIsPreparingStreams(true);
        setIsModalOpen(true);
        setStreamUrls([]);

        const urls: string[] = [];

        try {
            for (let i = 0; i < channels; i++) {
                // The channel to send depends on the model.
                // JC400 expects 0-indexed, others expect 1-indexed.
                const apiChannel = bus.modelo_camara === 'jc400' ? i : i + 1;

                toast({
                    title: `Activando Cámara ${i + 1}...`,
                    description: `Enviando comando para el canal ${i + 1} del bus ${bus.matricula}.`,
                });

                const response = await fetch('/api/video/request-stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        imei: bus.imei_gps, 
                        channel: apiChannel,
                        model: bus.modelo_camara,
                    }),
                });

                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.message || `No se pudo iniciar la transmisión para el canal ${i + 1}.`);
                }
                
                // Use the URL from the API response instead of constructing it manually
                const streamUrl = data.url;
                urls.push(streamUrl);
                
                await delay(1000);
            }
            
            setStreamUrls(urls);
            toast({
                title: "¡Cámaras Activadas!",
                description: (
                  <div>
                    <p>Abriendo reproductor de video con {urls.length} canal(es).</p>
                    <div className="mt-2 w-full overflow-x-auto rounded-md bg-gray-900 p-2">
                      <pre className="text-xs text-white">{JSON.stringify(urls, null, 2)}</pre>
                    </div>
                  </div>
                ),
            });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error de Transmisión',
                description: error.message,
            });
            setIsModalOpen(false);
        } finally {
            setIsPreparingStreams(false);
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setStreamUrls([]);
        setBusForVideo(null);
    }


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
                    const isActive = activeBusId === bus.id;
                    const isOnRoute = !!bus.ruta?.status_ruta;

                    return (
                        <BusMarker
                            key={bus.id}
                            bus={bus}
                            icon={busIcon}
                            activeIcon={activeBusIcon}
                            isActive={isActive}
                            isOnRoute={isOnRoute}
                            onClick={() => handleBusClick(bus.id)}
                        />
                    );
                })}
                
                {selectedBusForInfoWindow && (
                     <InfoWindowF
                        position={selectedBusForInfoWindow.position}
                        onCloseClick={() => setActiveBusId(null)}
                        options={{
                            pixelOffset: new google.maps.Size(0, -50),
                            disableAutoPan: true,
                        }}
                    >
                         <div className="p-3 bg-background rounded-lg shadow-lg w-48 flex flex-col gap-1">
                            <h3 className="font-bold text-base">{selectedBusForInfoWindow.matricula}</h3>
                            <p className="text-sm text-muted-foreground">{selectedBusForInfoWindow.ruta?.nombre || 'Ruta no asignada'}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedBusForInfoWindow.conductor ? `${selectedBusForInfoWindow.conductor.nombre} ${selectedBusForInfoWindow.conductor.apellido || ''}`.trim() : 'No asignado'}</span>
                            </div>
                            <Button size="sm" className="w-full mt-2" onClick={() => handleWatchAllCameras(selectedBusForInfoWindow)}>
                                <Video className="mr-2 h-4 w-4" />
                                Ver Video
                            </Button>
                        </div>
                    </InfoWindowF>
                )}


                {colegio?.lat && colegio.lng && colegioMarkerIcon && (
                    <MarkerF 
                        position={{ lat: colegio.lat, lng: colegio.lng }}
                        icon={colegioMarkerIcon}
                        title={colegio.nombre}
                        zIndex={1}
                    />
                )}
                
                {selectedBusForInfoWindow && selectedBusForInfoWindow.ruta && (
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
                                    bus={buses.find(b => b.ruta?.id === (hijo as any).ruta_id)}
                                    isActive={activeChildId === hijo.id}
                                />
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            )}

            {isModalOpen && busForVideo && (
                <MultiVideoPlayerModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    streamUrls={streamUrls}
                    busMatricula={busForVideo.matricula}
                    isLoading={isPreparingStreams}
                />
            )}
        </div>
    );
}
