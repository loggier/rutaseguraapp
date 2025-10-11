
'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Ruta, Estudiante, Parada } from '@/lib/types';

const formSchema = z.object({
  routeId: z.string().uuid(),
  selectedStudentIds: z.array(z.string().uuid()),
});

export type State = {
  message?: string | null;
  errors?: Record<string, string[]>;
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

export async function updateRouteAssignments(
  route: Ruta,
  allStudents: (Estudiante & { paradas: Parada[] })[],
  prevState: State,
  formData: FormData
): Promise<State> {
  const supabaseAdmin = createSupabaseAdminClient();
  const selectedStudentIds = formData.getAll('student_ids') as string[];

  const validatedFields = formSchema.safeParse({
    routeId: route.id,
    selectedStudentIds: selectedStudentIds,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Datos inválidos.',
    };
  }

  const { routeId } = validatedFields.data;

  try {
    // 1. Get current assignments for this route
    const { data: currentAssignments, error: fetchError } = await supabaseAdmin
      .from('ruta_estudiantes')
      .select('estudiante_id')
      .eq('ruta_id', routeId);

    if (fetchError) throw fetchError;
    const currentStudentIds = new Set(currentAssignments.map(a => a.estudiante_id));
    const newStudentIds = new Set(selectedStudentIds);

    // 2. Determine who to add and who to remove
    const studentsToAdd = selectedStudentIds.filter(id => !currentStudentIds.has(id));
    const studentsToRemove = Array.from(currentStudentIds).filter(id => !newStudentIds.has(id));

    // 3. Remove students
    if (studentsToRemove.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('ruta_estudiantes')
        .delete()
        .eq('ruta_id', routeId)
        .in('estudiante_id', studentsToRemove);
      
      if (deleteError) throw new Error(`Error al desasignar estudiantes: ${deleteError.message}`);
    }

    // 4. Add new students
    if (studentsToAdd.length > 0) {
      const newAssignments = [];
      const studentsWithoutStop = [];

      for (const studentId of studentsToAdd) {
        const student = allStudents.find(s => s.id === studentId);
        const activeStop = student?.paradas.find(p => p.activo && p.tipo === route.turno);

        if (activeStop) {
          newAssignments.push({
            ruta_id: routeId,
            estudiante_id: studentId,
            parada_id: activeStop.id,
          });
        } else {
            studentsWithoutStop.push(student?.nombre);
        }
      }
      
      if (newAssignments.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from('ruta_estudiantes')
            .insert(newAssignments);
          
          if (insertError) throw new Error(`Error al asignar nuevos estudiantes: ${insertError.message}`);
      }

      if (studentsWithoutStop.length > 0) {
          const studentNames = studentsWithoutStop.join(', ');
          return {
              message: `Asignación parcial. Los siguientes estudiantes no tienen una parada activa de tipo '${route.turno}' y no fueron añadidos: ${studentNames}.`
          };
      }
    }
  } catch (e: any) {
    return { message: e.message };
  }
  
  revalidatePath(`/dashboard/routes/${route.id}/manage`);
  revalidatePath('/dashboard/routes');
  redirect('/dashboard/routes');
}
