'use server';

import { createServerClient } from '@supabase/ssr';
import type { Profile } from '@/lib/types';

// This is a server-side only function
const createSupabaseAdminClient = () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get: () => undefined,
                set: () => {},
                remove: () => {},
            },
            db: {
              schema: 'rutasegura',
            },
        }
    );
}

/**
 * Fetches parents associated with a specific school or all parents for admin roles.
 * @param userId - The ID of the currently logged-in user.
 * @param userRole - The role of the currently logged-in user.
 * @returns A promise that resolves to an array of parent profiles.
 */
export async function getParentsForSchool(userId: string, userRole: Profile['rol']): Promise<Profile[]> {
    const supabaseAdmin = createSupabaseAdminClient();

    let query = supabaseAdmin
        .from('profiles')
        .select(`
            id,
            nombre,
            apellido,
            email:users (email)
        `)
        .eq('rol', 'padre')
        .eq('activo', true);

    if (userRole === 'colegio') {
        // Find the colegio_id for the current 'colegio' user
        const { data: colegioData, error: colegioError } = await supabaseAdmin
            .from('colegios')
            .select('id')
            .eq('usuario_id', userId)
            .single();

        if (colegioError || !colegioData) {
            console.error('Could not find colegio for user:', userId);
            return [];
        }
        // Filter parents by that colegio_id
        query = query.eq('colegio_id', colegioData.id);
    }
    // For 'master' or 'manager', we fetch all active parents

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching parents:", error);
        throw new Error('Failed to fetch parents.');
    }

    const formattedData = data.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        email: p.email.email, // Unnest the email
    })) as Profile[];

    return formattedData;
}
