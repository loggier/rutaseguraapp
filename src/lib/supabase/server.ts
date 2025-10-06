import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server';

export const createClient = (request: NextRequest) => {
    let cookieStore = cookies()
    const response = new Response();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
                request.cookies.set({ name, value, ...options })
                
            },
            remove(name: string, options: CookieOptions) {
                request.cookies.set({ name, value: '', ...options })
            },
          },
        }
      )

      return { supabase, response };
}
