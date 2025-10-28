
import { createBrowserClient } from '@supabase/ssr'

// La función `createClient` ahora puede ser llamada desde cualquier componente de cliente
// para obtener una instancia del cliente de Supabase. Esto es más seguro que usar
// una única instancia compartida.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        // Se especifica el esquema a utilizar para todas las consultas.
        schema: 'rutasegura',
      },
    }
  );
}
