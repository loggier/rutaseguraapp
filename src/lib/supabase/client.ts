import { createBrowserClient } from '@supabase/ssr'

// Se modifica la función para que lea las variables de entorno directamente.
// Esto asegura que el cliente siempre se cree con las credenciales correctas.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
