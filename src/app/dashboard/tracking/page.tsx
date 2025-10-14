'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  useLoadScript,
  GoogleMap,
  MarkerF,
  PolylineF,
  InfoWindowF,
} from '@react-google-maps/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, RotateCcw, MapPin, School, User, Bus as BusIcon, List, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { TrackedBus, Parada, Conductor } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import Image from 'next/image';


const libraries: ('geometry')[] = ['geometry'];
const mapCenter = { lat: -0.180653, lng: -78.467834 }; // Quito

type BusSimulationState = {
  status: 'paused' | 'running' | 'stopped' | 'finished';
  currentStopIndex: number;
  position: google.maps.LatLngLiteral;
}

export default function TrackingPage() {
  const [buses, setBuses] = useState<TrackedBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulations, setSimulations] = useState<Record<string, BusSimulationState>>({});
  const [activeBusId, setActiveBusId] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Fetch active buses with their relations
  useEffect(() => {
    async function fetchTrackedBuses() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('autobuses')
        .select(`
          id,
          matricula,
          capacidad,
          imei_gps,
          conductor:conductores(*),
          ruta:rutas!inner(
            *,
            colegio:colegios(*),
            paradas:ruta_estudiantes!inner(
              parada:paradas!inner(id, direccion, lat, lng)
            )
          )
        `)
        .eq('estado', 'activo')
        .not('ruta_id', 'is', null);

      if (error) {
        console.error('Error fetching tracked buses:', error);
      } else {
        const initialSims: Record<string, BusSimulationState> = {};
        const trackedBuses: TrackedBus[] = data.map((bus: any) => {
          const colegio = Array.isArray(bus.ruta.colegio) ? bus.ruta.colegio[0] : bus.ruta.colegio;
          
          const uniqueParadas = Array.from(new Map(bus.ruta.paradas.map((p: any) => p.parada).map((item: any) => [item.id, item])).values());
          
          initialSims[bus.id] = {
            status: 'stopped',
            currentStopIndex: 0,
            position: { lat: colegio.lat, lng: colegio.lng },
          };
          
          return {
            ...bus,
            conductor: Array.isArray(bus.conductor) ? bus.conductor[0] : bus.conductor,
            ruta: {
              ...bus.ruta,
              colegio,
              paradas: uniqueParadas as Parada[],
            },
          };
        });
        
        setBuses(trackedBuses);
        setSimulations(initialSims);
      }
      setLoading(false);
    }
    fetchTrackedBuses();
  }, []);
  
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
          if (!bus) return;
          
          const currentSim = newSims[busId];
          const nextStopIndex = currentSim.currentStopIndex + 1;
          const stops = bus.ruta.paradas;

          if (nextStopIndex > stops.length) {
            // Finished, back to school
            newSims[busId] = {
              ...currentSim,
              status: 'finished',
              position: { lat: bus.ruta.colegio.lat!, lng: bus.ruta.colegio.lng! },
              currentStopIndex: stops.length,
            };
          } else {
            const nextStop = stops[nextStopIndex - 1];
            newSims[busId] = {
              ...currentSim,
              currentStopIndex: nextStopIndex,
              position: { lat: nextStop.lat, lng: nextStop.lng },
            };
          }
        });
        return newSims;
      });
    }, 5000); // Move every 5 seconds

    return () => clearInterval(interval);
  }, [simulations, buses]);
  

  const handleSimulationControl = (busId: string, action: 'start' | 'pause' | 'reset') => {
    setSimulations(prevSims => {
      const bus = buses.find(b => b.id === busId);
      if (!bus) return prevSims;

      const currentSim = prevSims[busId];
      const newSims = { ...prevSims };

      if (action === 'start') {
        if (currentSim.status === 'finished') { // If finished, reset first
           newSims[busId] = { status: 'running', currentStopIndex: 0, position: { lat: bus.ruta.colegio.lat!, lng: bus.ruta.colegio.lng! } };
        } else {
           newSims[busId] = { ...currentSim, status: 'running' };
        }
      } else if (action === 'pause') {
        newSims[busId] = { ...currentSim, status: 'paused' };
      } else if (action === 'reset') {
        newSims[busId] = { status: 'stopped', currentStopIndex: 0, position: { lat: bus.ruta.colegio.lat!, lng: bus.ruta.colegio.lng! } };
      }
      return newSims;
    });
  };
  
  const handleSelectBus = (busId: string | null) => {
    setActiveBusId(busId);
    if(busId && map) {
        const sim = simulations[busId];
        if(sim) {
            map.panTo(sim.position);
            map.setZoom(15);
        }
    }
  }
  
  const getStatusBadge = (status: BusSimulationState['status']) => {
    switch (status) {
        case 'running': return <Badge variant="default" className="bg-green-600">En Ruta</Badge>;
        case 'paused': return <Badge variant="secondary">Pausado</Badge>;
        case 'finished': return <Badge variant="outline">Finalizado</Badge>;
        case 'stopped':
        default: return <Badge variant="outline">Detenido</Badge>;
    }
  }


  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4">Cargando datos de seguimiento...</p></div>;
  }
  if (!isLoaded) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4">Cargando mapa...</p></div>;
  }
  if (loadError) {
    return <div className="p-4 text-destructive">Error al cargar el mapa. Revisa la clave de API de Google Maps.</div>;
  }

  return (
    <>
    <PageHeader title="Seguimiento de Flota" description="Monitorea todos los autobuses activos en tiempo real." />
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      <div className="lg:col-span-2 h-full rounded-lg overflow-hidden border">
        <GoogleMap
            mapContainerClassName='w-full h-full'
            center={mapCenter}
            zoom={12}
            onLoad={setMap}
            options={{ mapTypeControl: false, streetViewControl: false, maxZoom: 18 }}
        >
          {buses.map(bus => {
            const sim = simulations[bus.id];
            if (!sim) return null;
            
            const isSelected = activeBusId === bus.id;
            const routePath = [
                { lat: bus.ruta.colegio.lat!, lng: bus.ruta.colegio.lng! },
                ...bus.ruta.paradas.map(s => ({ lat: s.lat, lng: s.lng })),
                { lat: bus.ruta.colegio.lat!, lng: bus.ruta.colegio.lng! }
            ];

            return (
                <React.Fragment key={bus.id}>
                    {/* Bus Marker */}
                    <MarkerF 
                        position={sim.position} 
                        icon={{
                            url: '/bus.svg',
                            scaledSize: new google.maps.Size(isSelected ? 40 : 32, isSelected ? 40 : 32),
                            anchor: new google.maps.Point(isSelected ? 20 : 16, isSelected ? 20 : 16),
                        }}
                        zIndex={isSelected ? 100 : sim.status === 'running' ? 50 : 10}
                        onClick={() => handleSelectBus(bus.id)}
                    >
                        {isSelected && (
                             <InfoWindowF position={sim.position} onCloseClick={() => handleSelectBus(null)}>
                                <div>
                                    <p className='font-bold'>{bus.matricula}</p>
                                    <p className='text-sm'>{bus.ruta.nombre}</p>
                                    <p className='text-xs capitalize'>{sim.status}</p>
                                </div>
                            </InfoWindowF>
                        )}
                    </MarkerF>
                    {/* Route and Stops for Selected Bus */}
                    {isSelected && (
                      <>
                        <PolylineF path={routePath} options={{ strokeColor: '#4285F4', strokeWeight: 3, strokeOpacity: 0.8 }}/>
                        <MarkerF 
                            position={{ lat: bus.ruta.colegio.lat!, lng: bus.ruta.colegio.lng! }}
                            icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#f44336', fillOpacity: 1, strokeWeight: 0 }}
                            label={{ text: 'C', color: 'white', fontWeight: 'bold' }}
                        />
                        {bus.ruta.paradas.map((stop, index) => (
                           <MarkerF key={stop.id} position={{ lat: stop.lat, lng: stop.lng }} label={(index + 1).toString()} opacity={sim.currentStopIndex > index ? 0.5 : 1} />
                        ))}
                      </>
                    )}
                </React.Fragment>
            )
          })}
        </GoogleMap>
      </div>

      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Autobuses Activos ({buses.length})</CardTitle>
          <CardDescription>Controla la simulación de cada unidad.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {buses.length > 0 ? buses.map(bus => {
            const sim = simulations[bus.id];
            if(!sim) return null;
            
            const stopsCount = bus.ruta.paradas.length;
            const currentStopInfo = sim.currentStopIndex > 0 && sim.currentStopIndex <= stopsCount
                ? `Parada ${sim.currentStopIndex}/${stopsCount}: ${bus.ruta.paradas[sim.currentStopIndex-1]?.direccion}`
                : sim.status === 'finished' ? 'Ruta finalizada' : 'En el colegio';


            return (
              <div key={bus.id} className={cn("p-3 rounded-lg border transition-all cursor-pointer", activeBusId === bus.id && "ring-2 ring-primary bg-muted/50")} onClick={() => handleSelectBus(bus.id)}>
                <div className='flex justify-between items-start'>
                    <div>
                        <h4 className='font-semibold'>{bus.matricula}</h4>
                        <p className='text-sm text-muted-foreground'>{bus.ruta.nombre}</p>
                    </div>
                    {getStatusBadge(sim.status)}
                </div>
                 <div className='text-xs text-muted-foreground mt-2 truncate'>
                  <span className='font-medium'>Prox:</span> {currentStopInfo}
                </div>
                <div className="flex gap-2 mt-3">
                    <Button onClick={(e) => {e.stopPropagation(); handleSimulationControl(bus.id, 'start')}} disabled={sim.status === 'running'} size="sm" className="flex-1">
                        <Play className="mr-2 h-4 w-4" /> Iniciar
                    </Button>
                    <Button onClick={(e) => {e.stopPropagation(); handleSimulationControl(bus.id, 'pause')}} disabled={sim.status !== 'running'} variant="outline" size="sm" className="flex-1">
                        <Pause className="mr-2 h-4 w-4" /> Pausar
                    </Button>
                    <Button onClick={(e) => {e.stopPropagation(); handleSimulationControl(bus.id, 'reset')}} variant="ghost" size="icon">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            )
          }) : (
            <div className='flex h-full items-center justify-center text-muted-foreground text-center'>
                <p>No hay autobuses activos con rutas asignadas en este momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
