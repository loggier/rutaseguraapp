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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, RotateCcw, MapPin, School, User, Bus as BusIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Ruta, Autobus, Conductor, Estudiante, Parada, Colegio } from '@/lib/types';

// Types for fetched data
type EnrichedRuta = Ruta & {
  colegio: Colegio;
  autobus: (Autobus & { conductor: Conductor | null }) | null;
  estudiantes: (Estudiante & { paradas: Parada[] })[];
};

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['geometry'];
const mapCenter = { lat: -0.180653, lng: -78.467834 }; // Quito

export default function TrackingPage() {
  const [routes, setRoutes] = useState<EnrichedRuta[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation state
  const [simulationStatus, setSimulationStatus] = useState<'paused' | 'running' | 'stopped'>('stopped');
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [busPosition, setBusPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Fetch active routes with their relations
  useEffect(() => {
    async function fetchRoutes() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('rutas')
        .select(`
          *,
          colegio:colegios(*),
          autobus:autobuses!inner(*, conductor:conductores(*)),
          estudiantes:ruta_estudiantes!inner(
            estudiante:estudiantes!inner(
              *,
              paradas!inner(*)
            )
          )
        `)
        .eq('autobus.estado', 'activo');

      if (error) {
        console.error('Error fetching routes:', error);
      } else {
        const enrichedData: EnrichedRuta[] = data.map((route: any) => ({
          ...route,
          colegio: Array.isArray(route.colegio) ? route.colegio[0] : route.colegio,
          autobus: Array.isArray(route.autobus) ? route.autobus[0] : route.autobus,
          estudiantes: route.estudiantes.map((e: any) => e.estudiante),
        }));
        setRoutes(enrichedData);
        if (enrichedData.length > 0) {
          setSelectedRouteId(enrichedData[0].id);
        }
      }
      setLoading(false);
    }
    fetchRoutes();
  }, []);

  const selectedRoute = useMemo(() => {
    return routes.find(r => r.id === selectedRouteId);
  }, [selectedRouteId, routes]);

  const stops = useMemo(() => {
    if (!selectedRoute) return [];
    
    // Use the optimized route order if available, otherwise just use the student list order
    const orderedStudentIds = selectedRoute.ruta_optimizada_recogida?.routeOrder || selectedRoute.estudiantes.map(e => e.student_id);

    const stopsMap = new Map<string, Parada>();
    selectedRoute.estudiantes.forEach(student => {
      const activeStop = student.paradas.find(p => p.activo && p.tipo === 'Recogida'); // Assuming 'Recogida' for now
      if (activeStop) {
        stopsMap.set(student.student_id, activeStop);
      }
    });

    return orderedStudentIds
      .map(studentId => stopsMap.get(studentId))
      .filter((stop): stop is Parada => !!stop);

  }, [selectedRoute]);

  // Reset simulation when route changes
  useEffect(() => {
    setSimulationStatus('stopped');
    setCurrentStopIndex(0);
    if (selectedRoute?.colegio?.lat && selectedRoute?.colegio?.lng) {
      setBusPosition({ lat: selectedRoute.colegio.lat, lng: selectedRoute.colegio.lng });
    } else {
      setBusPosition(null);
    }
  }, [selectedRoute]);
  
  // Simulation interval
  useEffect(() => {
    if (simulationStatus !== 'running' || !stops.length || !selectedRoute?.colegio) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentStopIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        
        if (nextIndex > stops.length) {
            // Reached the end, back to school
            setBusPosition({ lat: selectedRoute.colegio.lat!, lng: selectedRoute.colegio.lng! });
            setSimulationStatus('stopped');
            return 0; // Reset for next run
        }
        
        const nextStop = stops[nextIndex - 1];
        if (nextStop) {
            setBusPosition({ lat: nextStop.lat, lng: nextStop.lng });
        }
        
        return nextIndex;
      });
    }, 3000); // Move every 3 seconds

    return () => clearInterval(interval);
  }, [simulationStatus, stops, selectedRoute?.colegio]);

  const handleSimulationControl = (action: 'start' | 'pause' | 'reset') => {
    if (action === 'start') {
        if(currentStopIndex > stops.length) { // If was finished, restart
             setCurrentStopIndex(0);
             if (selectedRoute?.colegio) setBusPosition({ lat: selectedRoute.colegio.lat, lng: selectedRoute.colegio.lng });
        }
        setSimulationStatus('running');
    }
    if (action === 'pause') setSimulationStatus('paused');
    if (action === 'reset') {
      setSimulationStatus('stopped');
      setCurrentStopIndex(0);
      if (selectedRoute?.colegio) setBusPosition({ lat: selectedRoute.colegio.lat, lng: selectedRoute.colegio.lng });
    }
  };


  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4">Cargando rutas...</p></div>;
  }
  if (!isLoaded) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4">Cargando mapa...</p></div>;
  }
  if (loadError) {
    return <div>Error al cargar el mapa. Revisa la clave de API de Google Maps.</div>;
  }

  const routePath = [
    ...(selectedRoute?.colegio ? [{ lat: selectedRoute.colegio.lat!, lng: selectedRoute.colegio.lng! }] : []),
    ...stops.map(s => ({ lat: s.lat, lng: s.lng })),
    ...(selectedRoute?.colegio ? [{ lat: selectedRoute.colegio.lat!, lng: selectedRoute.colegio.lng! }] : [])
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 h-[calc(100vh-10rem)] rounded-lg overflow-hidden">
        <GoogleMap
            mapContainerClassName='w-full h-full'
            center={busPosition || mapCenter}
            zoom={13}
        >
            {/* Colegio Marker */}
            {selectedRoute?.colegio?.lat && selectedRoute.colegio.lng && (
                <MarkerF 
                    position={{ lat: selectedRoute.colegio.lat, lng: selectedRoute.colegio.lng }} 
                    icon={{
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: 'white',
                    }}
                    label={{ text: 'C', color: 'white', fontWeight: 'bold' }}
                />
            )}
            {/* Stops Markers */}
            {stops.map((stop, index) => (
                <MarkerF 
                    key={stop.id} 
                    position={{ lat: stop.lat, lng: stop.lng }}
                    label={(index + 1).toString()}
                    opacity={currentStopIndex > index ? 0.5 : 1}
                />
            ))}
            {/* Bus Marker */}
            {busPosition && simulationStatus !== 'stopped' && (
                <MarkerF 
                    position={busPosition} 
                    icon={{
                        url: '/bus.svg',
                        scaledSize: new google.maps.Size(40, 40),
                        anchor: new google.maps.Point(20, 20),
                    }}
                    zIndex={100}
                >
                     <InfoWindowF position={busPosition} options={{ pixelOffset: new google.maps.Size(0, -40) }}>
                        <div>
                            <p className='font-bold'>{selectedRoute?.autobus?.matricula}</p>
                            <p>En ruta...</p>
                        </div>
                    </InfoWindowF>
                </MarkerF>
            )}
            {/* Route Polyline */}
            <PolylineF path={routePath} options={{ strokeColor: '#4285F4', strokeWeight: 3, strokeOpacity: 0.8 }}/>
        </GoogleMap>
      </div>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Seguimiento en Vivo</CardTitle>
           <Select onValueChange={setSelectedRouteId} value={selectedRouteId || ''} disabled={simulationStatus === 'running'}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una ruta activa" />
              </SelectTrigger>
              <SelectContent>
                {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          {selectedRoute ? (
            <div className='flex flex-col h-full'>
                {/* Trip Info */}
                <div className='space-y-3 mb-4'>
                    <div className="flex items-center gap-2 text-sm"><BusIcon className="w-4 h-4 text-muted-foreground"/> <strong>Autobús:</strong> {selectedRoute.autobus?.matricula}</div>
                    <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-muted-foreground"/> <strong>Conductor:</strong> {selectedRoute.autobus?.conductor?.nombre} {selectedRoute.autobus?.conductor?.apellido}</div>
                    <div className="flex items-center gap-2 text-sm capitalize"><Badge variant={simulationStatus === 'running' ? 'default' : 'secondary'}>{simulationStatus.replace('_', ' ')}</Badge> ({currentStopIndex > stops.length ? stops.length : currentStopIndex} de {stops.length} paradas)</div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 mb-4">
                    <Button onClick={() => handleSimulationControl('start')} disabled={simulationStatus === 'running'} className="flex-1">
                        <Play className="mr-2 h-4 w-4" /> Iniciar
                    </Button>
                    <Button onClick={() => handleSimulationControl('pause')} disabled={simulationStatus !== 'running'} variant="outline" className="flex-1">
                        <Pause className="mr-2 h-4 w-4" /> Pausar
                    </Button>
                    <Button onClick={() => handleSimulationControl('reset')} variant="destructive" size="icon">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
                
                {/* Stops List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    <h4 className='font-semibold'>Paradas del Recorrido</h4>
                     <div className='flex items-center gap-3 p-2 rounded-md bg-muted'>
                        <School className="w-5 h-5 text-primary"/>
                        <p className='font-medium text-sm'>{selectedRoute.colegio.nombre}</p>
                    </div>
                    {stops.map((stop, index) => (
                        <div key={stop.id} className={`flex items-center gap-3 p-2 rounded-md transition-all ${currentStopIndex > index ? 'bg-green-100 dark:bg-green-900/50 opacity-70' : 'bg-muted/50'}`}>
                            <MapPin className={`w-5 h-5 ${currentStopIndex > index ? 'text-green-600' : 'text-muted-foreground'}`}/>
                            <p className={`text-sm flex-1 truncate ${currentStopIndex > index ? 'line-through' : ''}`}>{stop.direccion}</p>
                        </div>
                    ))}
                </div>

            </div>
          ) : (
            <div className='flex h-full items-center justify-center text-muted-foreground'>
                <p>Selecciona una ruta para iniciar el seguimiento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
