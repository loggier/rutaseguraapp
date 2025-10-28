'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const updateAvatarSchema = z.object({
    avatar_url: z.string().url("URL de avatar inválida."),
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


// --- PATCH para actualizar el avatar del perfil ---
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profileId = params.id;
  try {
    const body = await request.json();
    
    const avatarValidation = updateAvatarSchema.safeParse(body);
    if(avatarValidation.success) {
        const { avatar_url } = avatarValidation.data;
        const supabaseAdmin = createSupabaseAdminClient();
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ avatar_url })
            .eq('id', profileId);
        
        if (updateError) {
            console.error("Error al actualizar el avatar del perfil:", updateError);
            return NextResponse.json({ message: 'Error interno al actualizar el avatar.' }, { status: 500 });
        }
        return NextResponse.json({ message: 'Avatar actualizado con éxito.', avatar_url }, { status: 200 });
    }

    // If no validation matches
    return NextResponse.json({ 
        message: "Datos inválidos para la operación PATCH.", 
        errors: { ...avatarValidation.error?.flatten().fieldErrors }
    }, { status: 400 });


  } catch (error: any) {
    console.error('Error inesperado en PATCH /api/profile/[id]:', error);
    return NextResponse.json({ message: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
