'use client';

import { useActionState, useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket, Map, Clock, ListOrdered, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOptimizedRoute, type State } from './actions';
import type { Estudiante, Parada, Ruta, Colegio } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoadScript, GoogleMap, DirectionsService, DirectionsRenderer, MarkerF } from '@react-google-maps/api';

const libraries: ('places')[] = ['places'];

type RouteOptimizationFormProps = {
  route: Ruta & { colegio: Colegio };
  students: (Pick<Estudiante, 'id' | 'student_id' | 'nombre' | 'apellido'> & { paradas: Parada[] })[];
};

export function RouteOptimizationForm({ route, students }: RouteOptimizationFormProps) {
  const { toast } = useToast();
  const [optimizationResult, setOptimizationResult] = useState<State | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [currentTurno, setCurrentTurno] = useState<'Recogida' | 'Entrega' | null>(null);

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const handleOptimize = async (turno: 'Recogida' | 'Entrega') => {
    setIsPending(true);
    setCurrentTurno(turno);
    setOptimizationResult(null);
    setDirections(null);

    const formData = new FormData();
    formData.append('routeId', route.id);
    formData.append('colegioLat', String(route.colegio.lat));
    formData.append('colegioLng', String(route.colegio.lng));
    formData.append('turno', turno);
    
    const stopsForTurno = students.map(student => {
        const stop = student.paradas.find(p => p.tipo === turno && p.activo);
        if (!stop) return null;
        return {
            studentId: student.student_id,
            location: {
                latitude: stop.lat,
                longitude: stop.lng,
            }
        };
    }).filter((stop): stop is { studentId: string; location: { latitude: number; longitude: number; } } => stop !== null);

    if (stopsForTurno.length < 2) {
        toast({
            variant: "destructive",
            title: "No hay suficientes paradas",
            description: `Se necesitan al menos 2 paradas activas de tipo '${turno}' para optimizar la ruta.`,
        });
        setIsPending(false);
        return;
    }

    formData.append('stops', JSON.stringify(stopsForTurno));
    
    const result = await getOptimizedRoute(optimizationResult, formData);
    
    setOptimizationResult(result);
    setIsPending(false);

     if (result.message) {
      toast({
        title: result.errors ? "Error de Optimización" : "Notificación de IA",
        description: result.message,
        variant: result.errors ? "destructive" : "default",
      });
    }
  };

  const directionsCallback = useCallback((
    response: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus
  ) => {
    if (status === 'OK' && response) {
      setDirections(response);
    } else {
      console.error(`Directions request failed due to ${status}`);
      toast({ variant: 'destructive', title: 'Error de Mapa', description: 'No se pudo calcular la ruta en el mapa.' });
    }
  }, [toast]);

  const directionsServiceOptions = useMemo<google.maps.DirectionsRequest | null>(() => {
    if (!optimizationResult?.result?.optimizedRoute) return null;

    const waypointsMap = new Map<string, { lat: number; lng: number }>();
    students.forEach(student => {
        const stop = student.paradas.find(p => p.tipo === currentTurno && p.activo);
        if (stop) {
            waypointsMap.set(student.student_id, { lat: stop.lat, lng: stop.lng });
        }
    });

    const orderedWaypoints = optimizationResult.result.optimizedRoute.routeOrder
      .map(studentId => waypointsMap.get(studentId))
      .filter((loc): loc is { lat: number; lng: number } => !!loc)
      .map(location => ({ location: new google.maps.LatLng(location.lat, location.lng), stopover: true }));

    if (orderedWaypoints.length === 0) return null;
    
    return {
      origin: new google.maps.LatLng(route.colegio.lat!, route.colegio.lng!),
      destination: new google.maps.LatLng(route.colegio.lat!, route.colegio.lng!),
      waypoints: orderedWaypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false, // The AI already optimized it
    };
  }, [optimizationResult, students, route.colegio, currentTurno]);


  return (
    <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Controles de Optimización</CardTitle>
                    <CardDescription>
                        Selecciona un turno para que la IA calcule la ruta más corta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        La herramienta considerará todos los estudiantes asignados a esta ruta que tengan una parada activa para el turno seleccionado.
                    </p>
                    <div className="flex gap-4">
                        {route.hora_salida_manana && (
                            <Button 
                                onClick={() => handleOptimize('Recogida')} 
                                disabled={isPending}
                                className='w-full'
                            >
                                {isPending && currentTurno === 'Recogida' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                                Optimizar Mañana (Recogida)
                            </Button>
                        )}
                         {route.hora_salida_tarde && (
                            <Button 
                                onClick={() => handleOptimize('Entrega')} 
                                disabled={isPending}
                                variant="secondary"
                                className='w-full'
                            >
                                {isPending && currentTurno === 'Entrega' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                                Optimizar Tarde (Entrega)
                            </Button>
                        )}
                    </div>
                    {!route.hora_salida_manana && !route.hora_salida_tarde && (
                         <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>No hay horarios definidos</AlertTitle>
                            <AlertDescription>
                                Esta ruta no tiene hora de salida. Edita la ruta para añadir horarios antes de optimizar.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
             {optimizationResult?.result && (
                 <Card>
                    <CardHeader>
                         <CardTitle>Resultado de la Optimización ({currentTurno})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="border-green-500 bg-green-500/10">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <AlertTitle className="text-green-400">Ruta Optimizada</AlertTitle>
                            <AlertDescription>
                                La IA ha generado la siguiente secuencia de paradas.
                            </AlertDescription>
                        </Alert>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Clock className="h-6 w-6 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                                    <p className="font-bold text-lg">{optimizationResult.result.optimizedRoute.estimatedTravelTime} min</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <ListOrdered className="h-6 w-6 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Paradas</p>
                                    <p className="font-bold text-lg">{optimizationResult.result.optimizedRoute.routeOrder.length}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Orden de Paradas Sugerido:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                            {optimizationResult.result.optimizedRoute.routeOrder.map((studentId) => (
                              <li key={studentId}>ID Estudiante: {studentId}</li>
                            ))}
                          </ol>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

      <Card className="h-[calc(100vh-12rem)] min-h-[500px]">
        <CardContent className="p-0 h-full w-full rounded-lg">
          {isPending ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="font-semibold">Optimizando ruta...</p>
            </div>
          ) : !isLoaded ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Cargando mapa...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-destructive">
                <AlertTriangle className="h-8 w-8 mb-4"/>
                <p>Error al cargar el mapa.</p>
            </div>
          ) : (
             <GoogleMap
                mapContainerClassName="h-full w-full rounded-lg"
                center={{ lat: route.colegio.lat!, lng: route.colegio.lng! }}
                zoom={12}
                onLoad={setMap}
              >
                {directionsServiceOptions && !directions && <DirectionsService options={directionsServiceOptions} callback={directionsCallback} />}
                {directions && <DirectionsRenderer options={{ directions }} />}
                {!directions && <MarkerF position={{ lat: route.colegio.lat!, lng: route.colegio.lng! }} label="C" title={route.colegio.nombre} />}
              </GoogleMap>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
