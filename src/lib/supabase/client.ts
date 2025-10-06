import { createBrowserClient } from '@supabase/ssr'

// La instancia del cliente se crea una sola vez cuando este módulo se carga por primera vez.
// Se asegura de que las variables de entorno ya estén disponibles.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Exportamos la función que simplemente devuelve la instancia ya creada.
export function createClient() {
  return supabase;
}
