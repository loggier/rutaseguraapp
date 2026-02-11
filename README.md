# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Arquitectura de Notificaciones Push

Independientemente de si usas Supabase en la nube o autoalojado, la lógica de envío de notificaciones push se inicia desde tu propio servidor de administración, no desde esta aplicación de padres.

### Opción 1: Lógica Directa en tu Backend de Admin (Recomendado para Self-Hosting)

Este es el enfoque más directo para una instancia de Supabase autoalojada.

1.  **Acción en tu Backend de Admin:** La lógica para enviar una notificación se inicia desde tu propio servidor de administración.
2.  **Llamada a Firebase desde tu Backend:** Tu servidor de admin es responsable de:
    a.  Buscar en la base de datos los tokens de notificación del usuario al que se quiere notificar.
    b.  Realizar una llamada a la API de Firebase Cloud Messaging (FCM) para enviar la notificación push.
    c.  Insertar un registro en la tabla `rutasegura.notificaciones` para que el usuario tenga un historial visible en la app.

#### Ejemplo de Lógica en tu Backend de Admin (Node.js/TypeScript)

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
        // 1. Obtener el token FCM del usuario
        const { data: tokenData, error: tokensError } = await supabaseAdmin
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', userId)
            .schema('rutasegura')
            .single(); // Usamos single() porque ahora hay un solo token por usuario

        if (tokensError) throw tokensError;

        // 2. Si hay un token, enviar la notificación push
        if (tokenData && tokenData.token) {
            const fcmPayload = {
                // 'to' es más simple para un solo dispositivo
                to: tokenData.token, 
                notification: { 
                    title: titulo, 
                    body: mensaje, 
                    icon: "/icons/icon-192x192.png" 
                },
                // Data payload para que el clic en la notificación abra una URL específica
                data: {
                    url: "/mipanel/notifications"
                }
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

### Opción 2: Servicio "Listener" Independiente (Avanzado)

Si deseas mantener tu backend de admin simple y solo quieres que inserte un registro en la tabla `notificaciones`, puedes crear un servicio separado que "escuche" los cambios en esa tabla y envíe las notificaciones.

1.  **Crea un Proyecto Aparte:** En una carpeta separada de tu app Next.js, crea un nuevo proyecto Node.js.
2.  **Instala Dependencias:** `npm install @supabase/supabase-js node-fetch dotenv`
3.  **Crea el Script:** Crea un archivo `listener.js` con la lógica para escuchar y enviar.
4.  **Ejecútalo como un Servicio:** Usa una herramienta como `pm2` para mantener este script corriendo en tu servidor. `pm2 start listener.js --name="notification-listener"`

#### Ejemplo de Código para `listener.js`

```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('Iniciando el listener de notificaciones...');

const channel = supabase
  .channel('notificaciones-listener')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'rutasegura', table: 'notificaciones' },
    async (payload) => {
      console.log('Nueva notificación detectada:', payload.new.id);
      const { user_id, titulo, mensaje } = payload.new;

      try {
        const { data: tokenData, error: tokensError } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', user_id)
            .schema('rutasegura')
            .single();

        if (tokensError) throw tokensError;

        if (tokenData && tokenData.token) {
            const fcmPayload = {
                to: tokenData.token,
                notification: { 
                    title: titulo, 
                    body: mensaje, 
                    icon: "/icons/icon-192x192.png" 
                },
                data: {
                    url: "/mipanel/notifications"
                }
            };
            
            await fetch("https://fcm.googleapis.com/fcm/send", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `key=${FCM_SERVER_KEY}` },
                body: JSON.stringify(fcmPayload),
            });
            console.log(`Push notification sent for notification ID: ${payload.new.id}`);
        }
      } catch (error) {
        console.error('Error al procesar la notificación:', error);
      }
    }
  )
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('¡Conectado y escuchando cambios en la tabla de notificaciones!');
    }
    if (status === 'CHANNEL_ERROR') {
      console.error('Error en el canal de escucha:', err);
    }
  });

// Mantener el script vivo
process.on('SIGINT', () => {
    supabase.removeChannel(channel);
    process.exit();
});
```

---

## Configuración de la Base de Datos

### Tabla de Tokens para Notificaciones (FCM)

Para habilitar las notificaciones push, necesitas una tabla para almacenar los tokens de los dispositivos. La siguiente configuración asegura que **solo exista un token por usuario**, lo que significa que las notificaciones solo llegarán al **último dispositivo que haya iniciado sesión**.

#### Script de Creación (Para nuevas instalaciones)

Ejecuta esto en tu Editor SQL de Supabase. Esto crea la tabla con la configuración correcta de un solo token por usuario.

```sql
-- Esta versión asegura UN SOLO token por usuario.
CREATE TABLE IF NOT EXISTS rutasegura.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- La restricción UNIQUE en `user_id` es la clave para un solo token por usuario.
    user_id UUID NOT NULL UNIQUE REFERENCES rutasegura.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Esta función actualiza automáticamente el campo `updated_at` cuando un registro cambia.
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

#### Script de Corrección (Si ya tienes la tabla con la configuración anterior)

Si creaste la tabla permitiendo múltiples tokens por usuario, ejecuta este script para migrar a la nueva estructura de token único.

**¡Atención!** Este script eliminará los tokens antiguos de los usuarios que tengan más de uno, conservando solo el más reciente.

```sql
-- 1. Elimina la restricción de unicidad del token (si existe).
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_token_key;

-- 2. Limpia los tokens duplicados por usuario, manteniendo solo el más reciente.
DELETE FROM rutasegura.fcm_tokens a
    USING rutasegura.fcm_tokens b
WHERE a.updated_at < b.updated_at
  AND a.user_id = b.user_id;

-- 3. Añade la restricción de unicidad al user_id.
-- Esto fallará si el paso 2 no se ejecuta correctamente o si hay duplicados restantes.
ALTER TABLE rutasegura.fcm_tokens ADD CONSTRAINT fcm_tokens_user_id_key UNIQUE (user_id);
```
