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

    // 1. Get all active parent user IDs
    const { data: parentUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('activo', true);

    if (usersError || !parentUsers) {
        console.error("Error fetching active parent users:", usersError);
        throw new Error('Failed to fetch active parent user accounts.');
    }
    
    const activeParentIds = parentUsers.map(u => u.id);
    if (activeParentIds.length === 0) return [];
    
    // Create a map of ID -> email for later use
    const emailMap = parentUsers.reduce((acc, user) => {
        acc[user.id] = user.email;
        return acc;
    }, {} as Record<string, string>);

    // 2. Fetch profiles for these active parents, with role 'padre'
    let profileQuery = supabaseAdmin
        .from('profiles')
        .select('id, nombre, apellido, colegio_id')
        .in('id', activeParentIds)
        .eq('rol', 'padre');

    // 3. If the user is a 'colegio', filter by their colegio_id
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

    // 4. Combine profile data with email from the user map
    const formattedData = profiles.map(p => ({
        ...p,
        email: emailMap[p.id] || 'N/A',
        rol: 'padre', // Explicitly set role
        activo: true, // They are all active by definition of the first query
    })) as Profile[];
    
    return formattedData;
}
