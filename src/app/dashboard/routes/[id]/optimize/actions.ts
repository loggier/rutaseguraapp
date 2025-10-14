
'use server';

import { optimizeRoutes, type OptimizeRoutesInput, type OptimizeRoutesOutput } from '@/ai/flows/optimize-routes-with-ai';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import type { OptimizedRouteResult } from '@/lib/types';


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

export type AIState = {
  message?: string | null;
  result?: OptimizeRoutesOutput;
  errors?: {
    form?: string[];
    stops?: string[];
    _form?: string[];
  };
};

const createSupabaseAdminClient = () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { get: () => undefined, set: () => {}, remove: () => {} },
            db: { schema: 'rutasegura' },
        }
    );
};

export async function getOptimizedRoute(prevState: AIState | null, formData: FormData): Promise<AIState> {
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
  
  const busCapacity = 50;
  const { stops, turno } = validatedFields.data;

  const aiInput: OptimizeRoutesInput = {
    busCapacity,
    students: stops,
    routeConstraints: `Optimizar para el turno de ${turno}. El punto de inicio y fin es la ubicación del colegio.`,
  };

  try {
    const result = await optimizeRoutes(aiInput);
    if (!result || !result.optimizedRoute) {
        return { message: 'La IA no pudo generar una ruta optimizada. Inténtalo de nuevo.' }
    }
    return {
      message: 'Ruta optimizada generada con éxito.',
      result,
    };
  } catch (error) {
    console.error("Error en el flujo de optimización de IA:", error);
    return { message: 'Ocurrió un error inesperado al contactar al servicio de IA.' };
  }
}

// --- Acción para guardar la ruta ---
const SaveRouteSchema = z.object({
    routeId: z.string().uuid(),
    turno: z.enum(['Recogida', 'Entrega']),
    optimizedRoute: z.object({
        routeOrder: z.array(z.string()),
        estimatedTravelTime: z.number(),
        polyline: z.string().optional(),
        googleMapsUrl: z.string().url().optional(),
        routeMapImageUrl: z.string().url().optional(),
    })
});

export type SaveState = {
    message: string;
    error?: boolean;
}

export async function saveOptimizedRoute(prevState: SaveState | null, formData: FormData): Promise<SaveState> {
    const validatedFields = SaveRouteSchema.safeParse({
        routeId: formData.get('routeId'),
        turno: formData.get('turno'),
        optimizedRoute: JSON.parse(formData.get('optimizedRoute') as string),
    });

    if (!validatedFields.success) {
        return { message: 'Datos inválidos para guardar la ruta.', error: true };
    }

    const { routeId, turno, optimizedRoute } = validatedFields.data;
    const supabaseAdmin = createSupabaseAdminClient();

    const updateColumn = turno === 'Recogida' ? 'ruta_optimizada_recogida' : 'ruta_optimizada_entrega';

    try {
        const { error } = await supabaseAdmin
            .from('rutas')
            .update({ [updateColumn]: optimizedRoute })
            .eq('id', routeId);
        
        if (error) throw error;

    } catch (e: any) {
        return { message: `Error al guardar la ruta en la base de datos: ${e.message}`, error: true };
    }
    
    revalidatePath(`/dashboard/routes/${routeId}/optimize`);
    return { message: `La ruta optimizada para el turno de ${turno} ha sido guardada.` };
}
