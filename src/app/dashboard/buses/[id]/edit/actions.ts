'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { User, Autobus, Colegio, Conductor, Ruta } from '@/lib/types';

const formSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida'),
  capacidad: z.coerce.number().int().min(1, 'La capacidad debe ser mayor a 0'),
  imei_gps: z.string().min(1, 'El IMEI del GPS es requerido'),
  estado: z.enum(['activo', 'inactivo', 'mantenimiento'], { required_error: 'Debes seleccionar un estado válido.'}),
  colegio_id: z.string({ required_error: 'Se debe seleccionar un colegio.' }).uuid('ID de colegio inválido'),
  conductor_id: z.string().uuid('ID de conductor inválido').optional().nullable(),
  ruta_id: z.string().uuid('ID de ruta inválido').optional().nullable(),
});

export type FormValues = z.infer<typeof formSchema>;

export type UpdateBusState = {
  message: string;
  errors?: Record<string, string[]>;
  success: boolean;
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

export async function getBusData(busId: string, user: User) {
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: bus, error: busError } = await supabaseAdmin
        .from('autobuses')
        .select('*')
        .eq('id', busId)
        .single();

    if (busError || !bus) {
        console.error("Error fetching bus:", busError);
        return null;
    }

    let colegios: Colegio[] = [];
    let allConductores: Conductor[] = [];
    let allRutas: Ruta[] = [];
    
    // Get all assigned driver IDs to exclude them, but keep the current one
    const { data: assignedBuses } = await supabaseAdmin.from('autobuses').select('conductor_id').not('conductor_id', 'is', null);
    const assignedDriverIds = (assignedBuses || []).map(b => b.conductor_id).filter(id => id !== bus.conductor_id);


    if (user.rol === 'master' || user.rol === 'manager') {
        const [
            { data: colegiosData },
            { data: conductoresData },
            { data: rutasData }
        ] = await Promise.all([
            supabaseAdmin.from('colegios_view').select('*').order('nombre'),
            supabaseAdmin.from('conductores_view').select('*'),
            supabaseAdmin.from('rutas').select('*')
        ]);
        colegios = colegiosData || [];
        allConductores = (conductoresData || []).filter(c => !assignedDriverIds.includes(c.id));
        allRutas = rutasData || [];

    } else if (user.rol === 'colegio') {
        const { data: colegioData } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', user.id).single();
        if (colegioData) {
            const [
                { data: conductoresData },
                { data: rutasData }
            ] = await Promise.all([
                supabaseAdmin.from('conductores_view').select('*').eq('colegio_id', colegioData.id),
                supabaseAdmin.from('rutas').select('*').eq('colegio_id', colegioData.id)
            ]);
            allConductores = (conductoresData || []).filter(c => !assignedDriverIds.includes(c.id));
            allRutas = rutasData || [];
        }
    }
    
    return {
        bus: bus as Autobus,
        colegios,
        allConductores,
        allRutas
    };
}

export async function updateBus(busId: string, user: User, values: FormValues): Promise<UpdateBusState> {
    const supabaseAdmin = createSupabaseAdminClient();
    
    let finalValues = { ...values };

    if (user.rol === 'colegio') {
        const { data: colegioData, error } = await supabaseAdmin.from('colegios').select('id').eq('usuario_id', user.id).single();
        if (error || !colegioData) {
             return { message: 'Error: No se pudo encontrar el colegio para este usuario.', success: false };
        }
        finalValues.colegio_id = colegioData.id;
    }
   
    const validatedFields = formSchema.safeParse(finalValues);
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos o tienen errores. Por favor, revisa el formulario.',
      success: false,
    };
  }

  const { matricula, capacidad, imei_gps, estado, colegio_id, conductor_id, ruta_id } = validatedFields.data;
  
  if (!colegio_id && user.rol !== 'colegio') {
    return {
      errors: { colegio_id: ['Se debe seleccionar un colegio.'] },
      message: 'Faltan campos obligatorios. No se pudo actualizar el autobús.',
      success: false,
    };
  }

  try {
    const { error } = await supabaseAdmin
      .from('autobuses')
      .update({
        matricula,
        capacidad,
        imei_gps,
        estado,
        colegio_id,
        conductor_id,
        ruta_id,
    })
      .eq('id', busId);

    if (error) {
      console.error('Error al actualizar autobús:', error);
      return { message: `Error en la base de datos: ${error.message}`, success: false };
    }
  } catch (e: any) {
    return {
      message: `Error inesperado: ${e.message}`,
      success: false,
    };
  }

  revalidatePath('/dashboard/buses');
  revalidatePath(`/dashboard/buses/${busId}/edit`);
  revalidatePath('/dashboard/drivers');
  return { message: 'Autobús actualizado con éxito.', success: true };
}

    