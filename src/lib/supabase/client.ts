
import { createBrowserClient } from '@supabase/ssr'

// Se crea una única instancia del cliente de Supabase para toda la aplicación del lado del cliente.
// Esta instancia es solo para consultas de datos, no para autenticación.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      // Se especifica el esquema a utilizar para todas las consultas.
      schema: 'rutasegura',
    },
  }
);

// Se exporta la instancia para que pueda ser importada y utilizada en cualquier componente de cliente.
export function createClient() {
  return supabase;
}
