'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const updateAvatarSchema = z.object({
    avatar_url: z.string().url("URL de avatar inválida."),
});

const updateProfileSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido."),
    apellido: z.string().min(1, "El apellido es requerido."),
    telefono: z.string().optional().nullable(),
});

const updateNotificationsSchema = z.object({
    notification_settings: z.record(z.boolean())
});


// Helper to create a Supabase admin client
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


// --- PATCH para actualizar campos del perfil ---
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profileId = params.id;
  try {
    const body = await request.json();
    const supabaseAdmin = createSupabaseAdminClient();

    // Intenta validar y actualizar avatar
    const avatarValidation = updateAvatarSchema.safeParse(body);
    if(avatarValidation.success) {
        const { avatar_url } = avatarValidation.data;
        const { error } = await supabaseAdmin.from('profiles').update({ avatar_url }).eq('id', profileId);
        if (error) throw new Error("Error al actualizar el avatar del perfil.");
        return NextResponse.json({ message: 'Avatar actualizado con éxito.', avatar_url }, { status: 200 });
    }

    // Intenta validar y actualizar datos personales
    const profileValidation = updateProfileSchema.safeParse(body);
    if(profileValidation.success) {
        const { nombre, apellido, telefono } = profileValidation.data;
        const { error } = await supabaseAdmin.from('profiles').update({ nombre, apellido, telefono }).eq('id', profileId);
        if (error) throw new Error("Error al actualizar los datos del perfil.");
        return NextResponse.json({ message: 'Perfil actualizado con éxito.' }, { status: 200 });
    }

    // Intenta validar y actualizar configuraciones de notificación
    const notificationsValidation = updateNotificationsSchema.safeParse(body);
    if(notificationsValidation.success) {
        const { notification_settings } = notificationsValidation.data;
        const { error } = await supabaseAdmin.from('profiles').update({ notification_settings }).eq('id', profileId);
        if (error) throw new Error("Error al actualizar las notificaciones.");
        return NextResponse.json({ message: 'Configuración de notificaciones guardada.' }, { status: 200 });
    }
    
    // Si ninguna validación coincide
    return NextResponse.json({ 
        message: "Datos inválidos para la operación PATCH.",
        errors: { 
            ...avatarValidation.error?.flatten().fieldErrors,
            ...profileValidation.error?.flatten().fieldErrors,
            ...notificationsValidation.error?.flatten().fieldErrors,
        }
    }, { status: 400 });


  } catch (error: any) {
    console.error('Error inesperado en PATCH /api/profile/[id]:', error);
    return NextResponse.json({ message: error.message || 'Error interno del servidor.' }, { status: 500 });
  }
}
