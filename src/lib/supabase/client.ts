
import { createBrowserClient } from '@supabase/ssr'

// Se crea una única instancia del cliente de Supabase para toda la aplicación del lado del cliente.
// Esto asegura que la sesión se gestione de manera consistente.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Asegura que la persistencia está configurada para el almacenamiento local.
      persistSession: true, 
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

// Se exporta la instancia para que pueda ser importada y utilizada en cualquier componente de cliente.
export function createClient() {
  return supabase;
}
