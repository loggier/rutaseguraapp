'use client';

import { useFormState, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { getOptimizedRoute, type State } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Trash2, Rocket, Map, Clock, CheckCircle, AlertCircle, ListOrdered } from 'lucide-react';
import { studentLocationsForOptimization } from '@/lib/data';
import { toast } from '@/hooks/use-toast';

const FormSchema = z.object({
  busCapacity: z.coerce.number().min(1, "La capacidad debe ser al menos 1"),
  students: z.array(z.object({
    studentId: z.string().min(1, "ID de estudiante requerido"),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
  })).min(2, "Se necesitan al menos 2 estudiantes"),
});

type FormData = z.infer<typeof FormSchema>;

export function RouteOptimizationForm() {
  const [formState, formAction] = useFormState<State, FormData>(getOptimizedRoute as any, { message: null });
  const [isPending, setIsPending] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      busCapacity: 20,
      students: studentLocationsForOptimization,
    },
  });

  const { fields, append, remove } = require('react-hook-form').useFieldArray({
    control: form.control,
    name: 'students',
  });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    const formData = new FormData();
    formData.append('busCapacity', String(data.busCapacity));
    formData.append('students', JSON.stringify(data.students));
    await formAction(formData);
    setIsPending(false);
  };
  
  useEffect(() => {
    if (formState?.message) {
      toast({
        title: formState.errors ? "Error de Validación" : "Notificación",
        description: formState.message,
        variant: formState.errors ? "destructive" : "default",
      });
    }
  }, [formState]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Parámetros de Optimización</CardTitle>
          <CardDescription>Define los estudiantes y la capacidad del autobús para generar la ruta más eficiente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="busCapacity">Capacidad del Autobús</Label>
              <Input id="busCapacity" type="number" {...form.register('busCapacity')} />
              {form.formState.errors.busCapacity && <p className="text-sm text-destructive mt-1">{form.formState.errors.busCapacity.message}</p>}
            </div>

            <div className="space-y-4">
              <Label>Estudiantes a Recoger</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input {...form.register(`students.${index}.studentId`)} placeholder="ID Estudiante" className="col-span-3" />
                    <Input {...form.register(`students.${index}.latitude`)} placeholder="Latitud" className="col-span-4" />
                    <Input {...form.register(`students.${index}.longitude`)} placeholder="Longitud" className="col-span-4" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="col-span-1">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
               {form.formState.errors.students && <p className="text-sm text-destructive mt-1">{form.formState.errors.students.message}</p>}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ studentId: `E${String(fields.length + 1).padStart(3, '0')}`, latitude: 0, longitude: 0 })}>
                Agregar Estudiante
              </Button>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Generar Ruta Óptima
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado de la Optimización</CardTitle>
          <CardDescription>Aquí se mostrará la ruta sugerida por la IA.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="font-semibold">Optimizando ruta...</p>
              <p className="text-sm text-muted-foreground">La IA está calculando la ruta más eficiente.</p>
            </div>
          )}
          {!isPending && formState?.result && (
             <div className="space-y-4">
                <Alert className="border-green-500 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-400">Ruta Generada</AlertTitle>
                    <AlertDescription>
                        {formState.message}
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Clock className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                            <p className="font-bold text-lg">{formState.result.optimizedRoute.estimatedTravelTime} min</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <ListOrdered className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Paradas</p>
                            <p className="font-bold text-lg">{formState.result.optimizedRoute.routeOrder.length}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Orden de Recogida:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm bg-muted p-3 rounded-md">
                    {formState.result.optimizedRoute.routeOrder.map((studentId) => (
                      <li key={studentId}>{studentId}</li>
                    ))}
                  </ol>
                </div>
              </div>
          )}
          {!isPending && !formState?.result && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Map className="h-10 w-10 mb-4" />
                <p>Los resultados de la ruta aparecerán aquí.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
