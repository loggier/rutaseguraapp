'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket, Map, Clock, ListOrdered, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOptimizedRoute, type State } from './actions';
import type { Estudiante, Parada, Ruta, Colegio } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type RouteOptimizationFormProps = {
  route: Ruta & { colegio: Colegio };
  students: (Pick<Estudiante, 'id' | 'student_id' | 'nombre' | 'apellido'> & { paradas: Parada[] })[];
};

export function RouteOptimizationForm({ route, students }: RouteOptimizationFormProps) {
  const { toast } = useToast();
  const [optimizationResult, setOptimizationResult] = useState<State | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [currentTurno, setCurrentTurno] = useState<'Recogida' | 'Entrega' | null>(null);

  const handleOptimize = async (turno: 'Recogida' | 'Entrega') => {
    setIsPending(true);
    setCurrentTurno(turno);
    setOptimizationResult(null);

    const formData = new FormData();
    formData.append('routeId', route.id);
    formData.append('colegioLat', String(route.colegio.lat));
    formData.append('colegioLng', String(route.colegio.lng));
    formData.append('turno', turno);
    
    // Filter students to get only the relevant stops for the selected turn
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
    }).filter(Boolean);

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

  return (
    <div className="grid md:grid-cols-2 gap-8">
        {/* --- Controles --- */}
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                La herramienta de IA considerará todos los estudiantes asignados a esta ruta que tengan una parada activa para el turno seleccionado.
            </p>
            <div className="flex gap-4">
                {route.hora_salida_manana && (
                    <Button 
                        onClick={() => handleOptimize('Recogida')} 
                        disabled={isPending}
                        className='w-full'
                    >
                        {isPending && currentTurno === 'Recogida' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                        Optimizar Ruta Mañana (Recogida)
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
                        Optimizar Ruta Tarde (Entrega)
                    </Button>
                )}
            </div>
            {!route.hora_salida_manana && !route.hora_salida_tarde && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No hay horarios definidos</AlertTitle>
                    <AlertDescription>
                        Esta ruta no tiene una hora de salida de mañana o tarde. Edita la ruta para añadir horarios antes de optimizar.
                    </AlertDescription>
                </Alert>
            )}
        </div>

        {/* --- Resultados --- */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado de la Optimización</CardTitle>
          <CardDescription>Aquí se mostrará la ruta sugerida por la IA para el turno seleccionado.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="font-semibold">Optimizando ruta de {currentTurno?.toLowerCase()}...</p>
              <p className="text-sm text-muted-foreground">La IA está calculando la ruta más eficiente.</p>
            </div>
          )}
          {!isPending && optimizationResult?.result && (
             <div className="space-y-4">
                <Alert className="border-green-500 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-400">Ruta Optimizada para {currentTurno}</AlertTitle>
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
              </div>
          )}
          {!isPending && !optimizationResult?.result && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Map className="h-10 w-10 mb-4" />
                <p>Los resultados de la optimización aparecerán aquí.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
