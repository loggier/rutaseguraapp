# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Arquitectura de Notificaciones Push

Para enviar notificaciones push a los dispositivos de los usuarios, se utiliza una arquitectura que combina Supabase y Firebase Cloud Messaging (FCM). El flujo es el siguiente:

1.  **Acción en la App (Admin):** Una acción en tu panel de administración (o en cualquier otro lugar) inserta un nuevo registro en la tabla `rutasegura.notificaciones`.
2.  **Disparador en la Base de Datos:** Un `TRIGGER` en la base de datos de Supabase detecta esta nueva inserción.
3.  **Ejecución de Edge Function:** El trigger invoca automáticamente una **Supabase Edge Function** (`send-push-notification`).
4.  **Llamada a Firebase:** La Edge Function obtiene los tokens de notificación del usuario de la tabla `fcm_tokens` y realiza una llamada a la API de Firebase (FCM) para enviar la notificación push.
5.  **Recepción en el Dispositivo:** El Service Worker de la PWA en el dispositivo del usuario recibe y muestra la notificación.

### ¿Dónde se crea la Supabase Edge Function?

La Supabase Edge Function **NO** vive dentro de este proyecto Next.js. Es un proyecto separado que se gestiona con la [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started). Debes crear un nuevo directorio en tu máquina local para gestionar tus funciones de Supabase, enlazarlo a tu proyecto de Supabase y desplegar la función desde allí.

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
