'use server';

import { optimizeRoutes, type OptimizeRoutesInput, type OptimizeRoutesOutput } from '@/ai/flows/optimize-routes-with-ai';
import { z } from 'zod';

const CoordinatesSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

const StopSchema = z.object({
  studentId: z.string(),
  location: CoordinatesSchema,
});

const FormSchema = z.object({
  routeId: z.string().uuid(),
  colegioLat: z.coerce.number(),
  colegioLng: z.coerce.number(),
  turno: z.enum(['Recogida', 'Entrega']),
  stops: z.array(StopSchema).min(2, "Se necesitan al menos 2 paradas para optimizar."),
});

export type State = {
  message?: string | null;
  result?: OptimizeRoutesOutput;
  errors?: {
    form?: string[];
    stops?: string[];
    _form?: string[];
  };
};

export async function getOptimizedRoute(prevState: State | null, formData: FormData): Promise<State> {
  const stopsData = JSON.parse(formData.get('stops') as string || '[]');

  const validatedFields = FormSchema.safeParse({
    routeId: formData.get('routeId'),
    colegioLat: formData.get('colegioLat'),
    colegioLng: formData.get('colegioLng'),
    turno: formData.get('turno'),
    stops: stopsData,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación. Por favor, revisa los datos enviados.',
    };
  }
  
  // Aunque el busCapacity no viene del formulario, lo seteamos aquí porque el Flow de IA lo requiere.
  // Podríamos hacerlo un valor configurable en el futuro.
  const busCapacity = 50;

  const { stops, turno } = validatedFields.data;

  const aiInput: OptimizeRoutesInput = {
    busCapacity,
    students: stops, // El esquema de IA usa 'students', pero le pasamos nuestras 'stops' que tienen el formato correcto.
    routeConstraints: `Optimizar para el turno de ${turno}. El punto de inicio y fin es la ubicación del colegio.`,
  };

  try {
    const result = await optimizeRoutes(aiInput);
    if (!result || !result.optimizedRoute) {
        return {
            message: 'La IA no pudo generar una ruta optimizada. Inténtalo de nuevo.'
        }
    }
    return {
      message: 'Ruta optimizada generada con éxito.',
      result,
    };
  } catch (error) {
    console.error("Error en el flujo de optimización de IA:", error);
    return {
      message: 'Ocurrió un error inesperado al contactar al servicio de IA.',
    };
  }
}
