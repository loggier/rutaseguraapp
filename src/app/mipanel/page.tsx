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

type SimulationState = {
  status: 'paused' | 'running' | 'stopped' | 'finished';
  currentStopIndex: number;
  position: google.maps.LatLngLiteral;
  currentTurno: 'Recogida' | 'Entrega';
};

const libraries: ('geometry')[] = ['geometry'];
const mapCenter = { lat: -0.180653, lng: -78.467834 };

export default function MiPanelPage() {
    const { user } = useUser();
    const [buses, setBuses] = useState<MappedBus[]>([]);
    const [hijos, setHijos] = useState<(Estudiante & {paradas: Parada[]})[]>([]);
    const [simulations, setSimulations] = useState<Record<string, SimulationState>>({});
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

            const initialSims: Record<string, SimulationState> = {};
            const mappedBuses = data.buses.map(bus => {
                if (bus.ruta?.colegio?.lat && bus.ruta?.colegio?.lng) {
                     const currentTurno = bus.ruta.hora_salida_manana ? 'Recogida' : 'Entrega';
                     initialSims[bus.id] = {
                        status: 'running',
                        currentStopIndex: 0,
                        position: { lat: bus.ruta.colegio.lat, lng: bus.ruta.colegio.lng },
                        currentTurno: currentTurno
                    };
                }
                return {
                    ...bus,
                    estudiantes_ids: data.hijos.filter(h => h.ruta_id === bus.ruta?.id).map(h => h.id)
                };
            });
            
            setBuses(mappedBuses);
            setSimulations(initialSims);
            
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

    // Simulation Engine
    useEffect(() => {
      const activeSimulationIds = Object.entries(simulations)
        .filter(([, sim]) => sim.status === 'running')
        .map(([id]) => id);

      if (activeSimulationIds.length === 0) return;

      const interval = setInterval(() => {
        setSimulations(prevSims => {
          const newSims = { ...prevSims };
          activeSimulationIds.forEach(busId => {
            const bus = buses.find(b => b.id === busId);
            if (!bus || !bus.ruta.colegio?.lat) return;
            
            const currentSim = newSims[busId];
            const optimizedRoute = currentSim.currentTurno === 'Recogida'
              ? bus.ruta.ruta_recogida
              : bus.ruta.ruta_entrega;

            const stopsSource = (bus.ruta.paradas || []);
            let orderedStops: Parada[] = [];

            if (optimizedRoute && Array.isArray(optimizedRoute.routeOrder)) {
                const stopsMap = new Map(stopsSource.map(s => [s.id, s]));
                 orderedStops = optimizedRoute.routeOrder
                   .map(stopId => stopsMap.get(stopId))
                   .filter((p): p is Parada => !!p);
            } else {
              orderedStops = stopsSource.filter(s => s.tipo === currentSim.currentTurno);
            }

            const nextStopIndex = currentSim.currentStopIndex + 1;
            
            if (nextStopIndex > orderedStops.length) {
              newSims[busId] = {...currentSim, status: 'finished', position: { lat: bus.ruta.colegio!.lat, lng: bus.ruta.colegio!.lng }, currentStopIndex: orderedStops.length };
            } else {
              const nextStop = orderedStops[nextStopIndex - 1];
              if(nextStop) {
                  newSims[busId] = { ...currentSim, currentStopIndex: nextStopIndex, position: { lat: nextStop.lat, lng: nextStop.lng } };
              }
            }
          });
          return newSims;
        });
      }, 5000); // Move every 5 seconds

      return () => clearInterval(interval);
    }, [simulations, buses]);
    
    const activeBus = useMemo(() => {
        if (!activeChildId) return null;
        const child = hijos.find(h => h.id === activeChildId);
        if (!child || !child.ruta_id) return null;
        return buses.find(b => b.ruta?.id === child.ruta_id);
    }, [activeChildId, hijos, buses]);


    useEffect(() => {
      if (activeBus && map) {
        const sim = simulations[activeBus.id];
        if (sim) {
          map.panTo(sim.position);
        }
      }
    }, [activeBus, map, simulations]);

    const decodedPolylinePath = useMemo(() => {
        if (!isLoaded || !activeBus) return [];
        const sim = simulations[activeBus.id];
        if (!sim) return [];

        const optimizedRoute = sim.currentTurno === 'Recogida' ? activeBus.ruta.ruta_recogida : activeBus.ruta.ruta_entrega;
        
        if (optimizedRoute && typeof optimizedRoute.polyline === 'string' && optimizedRoute.polyline) {
            try {
                return google.maps.geometry.encoding.decodePath(optimizedRoute.polyline);
            } catch (e) {
                console.error("Error decoding polyline: ", e);
            }
        }
        return [];
    }, [isLoaded, activeBus, simulations]);


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
                onLoad={setMap}
                options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: false }}
            >
                {buses.map(bus => {
                    const sim = simulations[bus.id];
                    if (!sim) return null;
                    const isActive = activeBus?.id === bus.id;

                    return (
                        <MarkerF 
                            key={bus.id}
                            position={sim.position} 
                            icon={{
                                url: '/bus.svg',
                                scaledSize: new google.maps.Size(isActive ? 48 : 36, isActive ? 48 : 36),
                                anchor: new google.maps.Point(isActive ? 24 : 18, isActive ? 24 : 18),
                            }}
                            zIndex={isActive ? 100 : 50}
                        />
                    );
                })}

                {activeBus && (
                    <>
                        <PolylineF path={decodedPolylinePath} options={{ strokeColor: '#4285F4', strokeWeight: 5, strokeOpacity: 0.8 }}/>
                        {activeBus.ruta.colegio?.lat && <MarkerF 
                            position={{ lat: activeBus.ruta.colegio.lat, lng: activeBus.ruta.colegio.lng }}
                            icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#f44336', fillOpacity: 1, strokeWeight: 0 }}
                            label={{ text: 'C', color: 'white', fontWeight: 'bold' }}
                            title={activeBus.ruta.colegio?.nombre}
                        />}
                    </>
                )}
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
                                    simulation={simulations[buses.find(b => b.ruta?.id === hijo.ruta_id)?.id || '']}
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
