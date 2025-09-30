'use server';

import { optimizeRoutes, type OptimizeRoutesInput, type OptimizeRoutesOutput } from '@/ai/flows/optimize-routes-with-ai';
import { z } from 'zod';

const FormSchema = z.object({
  busCapacity: z.coerce.number().min(1, "La capacidad debe ser al menos 1"),
  students: z.array(z.object({
    studentId: z.string(),
    latitude: z.coerce.number({invalid_type_error: "Latitud inválida"}),
    longitude: z.coerce.number({invalid_type_error: "Longitud inválida"}),
  })).min(2, "Se necesitan al menos 2 estudiantes"),
});

export type State = {
  message?: string | null;
  result?: OptimizeRoutesOutput;
  errors?: {
    busCapacity?: string[];
    students?: string | string[];
    _form?: string[];
  };
};

export async function getOptimizedRoute(prevState: State, formData: FormData): Promise<State> {
  const studentsData = JSON.parse(formData.get('students') as string || '[]');

  const validatedFields = FormSchema.safeParse({
    busCapacity: formData.get('busCapacity'),
    students: studentsData,
  });

  if (!validatedFields.success) {
    const studentErrors = validatedFields.error.flatten().fieldErrors.students;
    return {
      errors: {
          ...validatedFields.error.flatten().fieldErrors,
          students: studentErrors ? "Error en los datos de estudiantes." : undefined
      },
      message: 'Error de validación. Por favor, revisa los campos.',
    };
  }

  const { busCapacity, students } = validatedFields.data;

  const aiInput: OptimizeRoutesInput = {
    busCapacity,
    students: students.map(s => ({
      studentId: s.studentId,
      location: {
        latitude: s.latitude,
        longitude: s.longitude,
      }
    })),
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
    console.error(error);
    return {
      message: 'Ocurrió un error inesperado al contactar al servicio de IA.',
    };
  }
}
