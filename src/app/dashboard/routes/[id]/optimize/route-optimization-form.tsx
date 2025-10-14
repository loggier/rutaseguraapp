'use client';

import { useState, useEffect, useMemo, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket, MapIcon, Clock, ListOrdered, CheckCircle, AlertTriangle, ExternalLink, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOptimizedRoute, saveOptimizedRoute, type AIState, type SaveState } from './actions';
import type { Estudiante, Parada, Ruta, Colegio, OptimizedRouteResult } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoadScript, GoogleMap, DirectionsService, DirectionsRenderer, MarkerF, PolylineF } from '@react-google-maps/api';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

type RouteOptimizationFormProps = {
  route: Ruta & { colegio: Colegio };
  students: (Pick<Estudiante, 'id' | 'student_id' | 'nombre' | 'apellido'> & { paradas: Parada[] })[];
};

export function RouteOptimizationForm({ route, students }: RouteOptimizationFormProps) {
  const { toast } = useToast();
  
  const [saveState, saveOptimizedRouteAction] = useActionState(saveOptimizedRoute, null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [turno, setTurno] = useState<'Recogida' | 'Entrega'>(route.hora_salida_manana ? 'Recogida' : 'Entrega');
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRouteResult | null>(null);
  
  const [studentsMap, setStudentsMap] = useState<Map<string, { nombre: string; apellido: string }>>(new Map());
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [currentPolyline, setCurrentPolyline] = useState<string | undefined>(undefined);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });
  
  // Set initial optimized route from saved data
  useEffect(() => {
    const routeToShow = turno === 'Recogida' ? route.ruta_optimizada_recogida : route.ruta_optimizada_entrega;
    if (routeToShow) {
      setOptimizedRoute(routeToShow);
    } else {
      setOptimizedRoute(null);
    }
  }, [turno, route]);


  // Handle Save action result
  useEffect(() => {
    if (saveState) {
        toast({
            title: saveState.error ? "Error al Guardar" : "Éxito",
            description: saveState.message,
            variant: saveState.error ? "destructive" : "default",
        });
    }
  }, [saveState, toast]);

  // Process and display route on map
  useEffect(() => {
    if (optimizedRoute) {
      const tempStudentsMap = new Map(students.map(s => [s.student_id, { nombre: s.nombre, apellido: s.apellido }]));
      setStudentsMap(tempStudentsMap);
      
      const stopsForTurno = students.map(student => {
        const stop = student.paradas.find(p => p.tipo === turno && p.activo);
        if (!stop) return null;
        return { studentId: student.student_id, location: { latitude: stop.lat, longitude: stop.lng }};
      }).filter(Boolean);

      const waypointsMap = new Map<string, string>();
      stopsForTurno.forEach(s => s && waypointsMap.set(s.studentId, `${s.location.latitude},${s.location.longitude}`));
      
      const orderedWaypoints = optimizedRoute.routeOrder
        .map(studentId => waypointsMap.get(studentId))
        .filter(Boolean);

      const origin = `${route.colegio.lat},${route.colegio.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${origin}&waypoints=${orderedWaypoints.join('|')}&travelmode=driving`;
      setGoogleMapsUrl(url);
      setCurrentPolyline(optimizedRoute.polyline);

    } else {
        setGoogleMapsUrl('');
        setCurrentPolyline(undefined);
    }
  }, [optimizedRoute, students, route.colegio.lat, route.colegio.lng, turno]);


  const handleOptimize = async () => {
    setIsGenerating(true);
    setOptimizedRoute(null);
    
    const formData = new FormData();
    formData.append('routeId', route.id);
    formData.append('colegioLat', String(route.colegio.lat));
    formData.append('colegioLng', String(route.colegio.lng));
    formData.append('turno', turno);
    
    const stopsForTurno = students.map(student => {
        const stop = student.paradas.find(p => p.tipo === turno && p.activo);
        if (!stop) return null;
        return { studentId: student.student_id, location: { latitude: stop.lat, longitude: stop.lng }};
    }).filter(Boolean);

    if (stopsForTurno.length < 2) {
        toast({
            variant: "destructive", title: "No hay suficientes paradas",
            description: `Se necesitan al menos 2 paradas activas de tipo '${turno}' para optimizar.`,
        });
        setIsGenerating(false);
        return;
    }

    formData.append('stops', JSON.stringify(stopsForTurno));
    
    const aiStateResult = await getOptimizedRoute(null, formData);

    setIsGenerating(false);
    if (aiStateResult.message) {
      toast({
        title: aiStateResult.errors ? "Error de Optimización" : "Notificación de IA",
        description: aiStateResult.message,
        variant: aiStateResult.errors ? "destructive" : "default",
      });
    }
    if (aiStateResult.result?.optimizedRoute) {
      setOptimizedRoute(aiStateResult.result.optimizedRoute);
    }
  };
  
  const decodedPolylinePath = useMemo(() => {
    if (!currentPolyline || !isLoaded) return [];
    return google.maps.geometry.encoding.decodePath(currentPolyline);
  }, [currentPolyline, isLoaded]);

  const bothTurnosExist = route.hora_salida_manana && route.hora_salida_tarde;

  return (
    <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Controles de Optimización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {bothTurnosExist && (
                        <div className="flex items-center space-x-2 justify-center">
                            <Label htmlFor="turno-switch" className={turno === 'Recogida' ? 'font-bold' : 'text-muted-foreground'}>Mañana (Recogida)</Label>
                            <Switch
                                id="turno-switch"
                                checked={turno === 'Entrega'}
                                onCheckedChange={(checked) => setTurno(checked ? 'Entrega' : 'Recogida')}
                            />
                            <Label htmlFor="turno-switch" className={turno === 'Entrega' ? 'font-bold' : 'text-muted-foreground'}>Tarde (Entrega)</Label>
                        </div>
                    )}
                    <Button onClick={handleOptimize} disabled={isGenerating} className='w-full'>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                        {optimizedRoute ? 'Volver a Generar Ruta' : 'Generar Ruta Óptima'}
                    </Button>
                     {!route.hora_salida_manana && !route.hora_salida_tarde && (
                         <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>No hay horarios definidos</AlertTitle><AlertDescription>Esta ruta no tiene hora de salida.</AlertDescription></Alert>
                    )}
                </CardContent>
            </Card>
             {optimizedRoute && (
                 <Card>
                    <CardHeader>
                         <CardTitle>Resultado de la Optimización ({turno})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg"><Clock className="h-6 w-6 text-primary" /><div><p className="text-sm text-muted-foreground">Tiempo Estimado</p><p className="font-bold text-lg">{optimizedRoute.estimatedTravelTime} min</p></div></div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg"><ListOrdered className="h-6 w-6 text-primary" /><div><p className="text-sm text-muted-foreground">Paradas</p><p className="font-bold text-lg">{optimizedRoute.routeOrder.length}</p></div></div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Orden de Viaje Sugerido:</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                            <li className='font-semibold'>Salida: {route.colegio.nombre}</li>
                            {optimizedRoute.routeOrder.map((studentId) => {
                                const studentInfo = studentsMap.get(studentId);
                                return <li key={studentId}>{studentId} - {studentInfo ? `${studentInfo.nombre} ${studentInfo.apellido}` : 'Estudiante desconocido'}</li>
                            })}
                            <li className='font-semibold'>Destino: {route.colegio.nombre}</li>
                          </ol>
                        </div>
                        <div className='flex gap-2'>
                             {googleMapsUrl && <Button asChild className="w-full" variant="outline"><a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4"/>Abrir en Google Maps</a></Button>}
                             <form action={saveOptimizedRouteAction} className='w-full'>
                               <input type="hidden" name="routeId" value={route.id} />
                               <input type="hidden" name="turno" value={turno} />
                               <input type="hidden" name="optimizedRoute" value={JSON.stringify({ ...optimizedRoute, polyline: currentPolyline, googleMapsUrl: googleMapsUrl })} />
                               <Button type="submit" className="w-full"><Save className="mr-2 h-4 w-4" />Guardar Ruta</Button>
                              </form>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

      <Card className="h-[calc(100vh-12rem)] min-h-[500px]">
        <CardContent className="p-0 h-full w-full rounded-lg">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mb-4" /><p className="font-semibold">Optimizando ruta...</p></div>
          ) : !isLoaded ? (
            <div className="flex flex-col items-center justify-center h-full text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mb-4" /><p>Cargando mapa...</p></div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-destructive"><AlertTriangle className="h-8 w-8 mb-4"/><p>Error al cargar el mapa.</p></div>
          ) : (
             <GoogleMap mapContainerClassName="h-full w-full rounded-lg" center={{ lat: route.colegio.lat!, lng: route.colegio.lng! }} zoom={12} options={{ mapTypeControl: false, streetViewControl: false }}>
                {/* Render polyline from saved data if available */}
                 {decodedPolylinePath.length > 0 && (
                    <PolylineF path={decodedPolylinePath} options={{ strokeColor: '#4A90E2', strokeWeight: 5 }} />
                )}

                {/* Render markers */}
                <MarkerF position={{ lat: route.colegio.lat!, lng: route.colegio.lng! }} label={{ text: 'C', color: 'white', fontWeight: 'bold' }} title={route.colegio.nombre} />
                {optimizedRoute && students.map(student => {
                    const stop = student.paradas.find(p => p.tipo === turno && p.activo);
                    if (!stop) return null;
                    const orderIndex = optimizedRoute.routeOrder.indexOf(student.student_id);
                    if (orderIndex === -1) return null;
                    return <MarkerF key={student.id} position={{ lat: stop.lat, lng: stop.lng }} label={(orderIndex + 1).toString()} title={`${student.nombre} ${student.apellido}`} />
                })}
              </GoogleMap>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
