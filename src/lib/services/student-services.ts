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

    // 1. Fetch profiles for with role 'padre'
    let profileQuery = supabaseAdmin
        .from('profiles')
        .select('id, nombre, apellido, colegio_id')
        .eq('rol', 'padre');

    // 2. If the user is a 'colegio', filter by their colegio_id
    if (userRole === 'colegio') {
        const { data: colegioData, error: colegioError } = await supabaseAdmin
            .from('colegios')
            .select('id')
            .eq('usuario_id', userId)
            .single();

        if (colegioError || !colegioData) {
            console.error('Could not find colegio for user:', userId, colegioError);
            return []; // Return empty if no colegio is found for the user
        }
        profileQuery = profileQuery.eq('colegio_id', colegioData.id);
    }

    const { data: profiles, error: profileError } = await profileQuery;

    if (profileError) {
        console.error("Error fetching parent profiles:", profileError);
        throw new Error('Failed to fetch parent profiles.');
    }
    
    if (!profiles || profiles.length === 0) {
        return [];
    }

    const parentIds = profiles.map(p => p.id);
    
    // 3. Get all user data for the fetched profiles
    const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, activo')
        .in('id', parentIds);

    if (usersError) {
        console.error("Error fetching users for profiles:", usersError);
        throw new Error('Failed to fetch user data for parents.');
    }

    const usersMap = usersData.reduce((acc, user) => {
        acc[user.id] = { email: user.email, activo: user.activo };
        return acc;
    }, {} as Record<string, { email: string; activo: boolean; }>);


    // 4. Combine profile data with email from the user map
    const formattedData = profiles.map(p => ({
        ...p,
        email: usersMap[p.id]?.email || 'N/A',
        rol: 'padre', // Explicitly set role
        activo: usersMap[p.id]?.activo ?? false, 
    })) as Profile[];
    
    return formattedData;
}
