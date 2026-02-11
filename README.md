# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Arquitectura de Notificaciones Push (Supabase Autoalojado)

Si estás usando una instancia autoalojada (self-hosted) de Supabase, no puedes usar Supabase Edge Functions. La arquitectura correcta para enviar notificaciones push es la siguiente:

1.  **Acción en tu Backend de Admin:** La lógica para enviar una notificación se inicia desde tu propio servidor de administración (el que usan los administradores del colegio, no esta app de padres).
2.  **Llamada a Firebase desde tu Backend:** Tu servidor de admin es responsable de:
    a.  Buscar en la base de datos los tokens de notificación del usuario al que se quiere notificar.
    b.  Realizar una llamada a la API de Firebase Cloud Messaging (FCM) para enviar la notificación push.
    c.  Insertar un registro en la tabla `rutasegura.notificaciones` para que el usuario tenga un historial visible en la app.
3.  **Recepción en el Dispositivo:** El Service Worker de la PWA en el dispositivo del usuario recibe y muestra la notificación.

### Ejemplo de Lógica en tu Backend de Admin (Node.js/TypeScript)

```typescript
// Este código debe vivir en el servidor de tu panel de administración.

import { createClient } from '@supabase/supabase-js';

// Estas claves deben ser variables de entorno en tu servidor de admin
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY!; // Tu clave de servidor de Firebase

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function enviarNotificacion(userId: string, titulo: string, mensaje: string) {
    try {
        // 1. Obtener los tokens FCM del usuario
        const { data: tokens, error: tokensError } = await supabaseAdmin
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', userId)
            .schema('rutasegura');

        if (tokensError) throw tokensError;

        // 2. Si hay tokens, enviar la notificación push
        if (tokens && tokens.length > 0) {
            const fcmPayload = {
                registration_ids: tokens.map(t => t.token),
                notification: { title, body: mensaje, icon: "/icons/icon-192x192.png" },
            };
            await fetch("https://fcm.googleapis.com/fcm/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `key=${FCM_SERVER_KEY}`,
                },
                body: JSON.stringify(fcmPayload),
            });
        }

        // 3. Guardar el historial de la notificación en la base de datos
        const { error: insertError } = await supabaseAdmin
            .from('notificaciones')
            .insert({ user_id: userId, titulo, mensaje, tipo: 'general' })
            .schema('rutasegura');

        if (insertError) throw insertError;

    } catch (error) {
        console.error("Error en el proceso de enviar notificación:", error);
    }
}
```

---

## Configuración de la Base de Datos

### Tabla de Tokens para Notificaciones (FCM)

Para habilitar las notificaciones push a través de Firebase Cloud Messaging, necesitas crear una tabla en tu base de datos de Supabase para almacenar los tokens de los dispositivos de los usuarios. Este script SQL está diseñado para que sea seguro ejecutarlo varias veces.

Ejecuta el siguiente SQL en tu Editor SQL de Supabase:

```sql
-- Crear la tabla solo si no existe para prevenir errores al re-ejecutar.
CREATE TABLE IF NOT EXISTS rutasegura.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES rutasegura.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Esta función actualiza automáticamente el campo `updated_at` cuando un registro cambia.
-- `CREATE OR REPLACE` asegura que se pueda volver a ejecutar sin error.
CREATE OR REPLACE FUNCTION rutasegura.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Primero eliminamos el trigger para asegurarnos de poder re-ejecutar el script sin errores.
DROP TRIGGER IF EXISTS update_fcm_tokens_updated_at ON rutasegura.fcm_tokens;

-- Este trigger ejecuta la función cuando una fila en `fcm_tokens` es actualizada.
CREATE TRIGGER update_fcm_tokens_updated_at
BEFORE UPDATE ON rutasegura.fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION rutasegura.update_updated_at_column();
```
