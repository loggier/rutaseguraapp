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
        .select('id, nombre, apellido')
        .eq('rol', 'padre')
        .eq('activo', true);

    if (userRole === 'colegio') {
        const { data: colegioData, error: colegioError } = await supabaseAdmin
            .from('colegios')
            .select('id')
            .eq('usuario_id', userId)
            .single();

        if (colegioError || !colegioData) {
            console.error('Could not find colegio for user:', userId);
            return [];
        }
        query = query.eq('colegio_id', colegioData.id);
    }

    const { data: profiles, error: profileError } = await query;
    if (profileError) {
        console.error("Error fetching parent profiles:", profileError);
        throw new Error('Failed to fetch parent profiles.');
    }
    
    const parentIds = profiles.map(p => p.id);
    if(parentIds.length === 0) return [];
    
    const { data: users, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .in('id', parentIds);

    if (userError) {
        console.error("Error fetching parent emails:", userError);
        throw new Error('Failed to fetch parent emails.');
    }

    const emailMap = users.reduce((acc, user) => {
        acc[user.id] = user.email;
        return acc;
    }, {} as Record<string, string>);

    const formattedData = profiles.map(p => ({
        ...p,
        email: emailMap[p.id] || 'N/A',
    })) as Profile[];
    
    return formattedData;
}
