
'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Ruta } from '@/lib/types';

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
  prevState: State,
  formData: FormData
): Promise<State> {
  const supabaseAdmin = createSupabaseAdminClient();
  // We get ALL `student_ids` entries. `getAll` is important here.
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
    const studentsToRemove = Array.from(currentStudentIds).filter(id => !newStudentIds.has(id));
    const studentsToAdd = selectedStudentIds.filter(id => !currentStudentIds.has(id));

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
      const { data: studentsWithStops, error: studentsDataError } = await supabaseAdmin
        .from('estudiantes')
        .select('id, nombre, paradas!inner(*)')
        .in('id', studentsToAdd)
        .eq('paradas.activo', true)
        .eq('paradas.tipo', route.turno);

      if (studentsDataError) throw new Error(`Error al verificar paradas de estudiantes: ${studentsDataError.message}`);
      
      const studentsWithActiveStop = new Map(studentsWithStops.map(s => [s.id, s]));
      const newAssignments = [];
      const studentsWithoutStopNames = [];

      for (const studentId of studentsToAdd) {
        const studentData = studentsWithActiveStop.get(studentId);
        if (studentData && studentData.paradas.length > 0) {
          newAssignments.push({
            ruta_id: routeId,
            estudiante_id: studentId,
            parada_id: studentData.paradas[0].id,
          });
        } else {
            const {data: student} = await supabaseAdmin.from('estudiantes').select('nombre, apellido').eq('id', studentId).single();
            studentsWithoutStopNames.push(`${student?.nombre} ${student?.apellido}`);
        }
      }
      
      if (newAssignments.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from('ruta_estudiantes')
            .insert(newAssignments);
          
          if (insertError) throw new Error(`Error al asignar nuevos estudiantes: ${insertError.message}`);
      }

      if (studentsWithoutStopNames.length > 0) {
          const studentNames = studentsWithoutStopNames.join(', ');
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
