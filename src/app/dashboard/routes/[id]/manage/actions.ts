

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
  const turnos: ('Recogida' | 'Entrega')[] = [];
  if (route.hora_salida_manana) turnos.push('Recogida');
  if (route.hora_salida_tarde) turnos.push('Entrega');

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
        .select('id, nombre, apellido, paradas!inner(*)')
        .in('id', studentsToAdd)
        .eq('paradas.activo', true)
        .in('paradas.tipo', turnos);

      if (studentsDataError) throw new Error(`Error al verificar paradas de estudiantes: ${studentsDataError.message}`);
      
      const newAssignments = [];
      const studentsWithoutStopNames = [];
      
      for (const studentId of studentsToAdd) {
        const studentData = studentsWithStops.find(s => s.id === studentId);
        
        // Find the active stop for the required turns
        const paradaRecogida = studentData?.paradas.find(p => p.tipo === 'Recogida');
        const paradaEntrega = studentData?.paradas.find(p => p.tipo === 'Entrega');

        let assignmentsForStudent = 0;

        if (route.hora_salida_manana && paradaRecogida) {
          newAssignments.push({ ruta_id: routeId, estudiante_id: studentId, parada_id: paradaRecogida.id });
          assignmentsForStudent++;
        }
        if (route.hora_salida_tarde && paradaEntrega) {
          newAssignments.push({ ruta_id: routeId, estudiante_id: studentId, parada_id: paradaEntrega.id });
          assignmentsForStudent++;
        }
        
        if (assignmentsForStudent === 0) {
            studentsWithoutStopNames.push(`${studentData?.nombre || 'Estudiante'} ${studentData?.apellido || ''}`);
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
          const requiredStops = turnos.join(' y ');
          return {
              message: `Asignación parcial. Los siguientes estudiantes no tienen una parada activa de tipo '${requiredStops}' y no fueron añadidos: ${studentNames}.`
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
