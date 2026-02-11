-- Este script realiza una corrección completa en la tabla `rutasegura.fcm_tokens`.
-- Arregla la clave foránea y las restricciones de unicidad para permitir que un usuario
-- tenga múltiples tokens (uno por dispositivo) pero sin duplicados.
-- Es seguro ejecutar este script múltiples veces.

-- 1. Elimina la clave foránea incorrecta que podría estar apuntando a `auth.users`.
ALTER TABLE rutasegura.fcm_tokens
DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_fkey;

-- 2. Elimina restricciones de unicidad antiguas que puedan causar conflictos.
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_key;
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_token_key;
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_token_unique;

-- 3. Añade la clave foránea CORRECTA, apuntando a `rutasegura.users`.
-- Esto asegura que el `user_id` en `fcm_tokens` siempre corresponda a un usuario válido en tu aplicación.
ALTER TABLE rutasegura.fcm_tokens
ADD CONSTRAINT fcm_tokens_user_id_fkey
FOREIGN KEY (user_id) REFERENCES rutasegura.users(id) ON DELETE CASCADE;

-- 4. Añade la restricción de unicidad compuesta sobre el par (user_id, token).
-- Esto es crucial: previene que se inserte el mismo token para el mismo usuario más de una vez,
-- pero permite que diferentes usuarios tengan el mismo token (improbable, pero posible) y
-- que un mismo usuario tenga diferentes tokens (un token por dispositivo).
ALTER TABLE rutasegura.fcm_tokens
ADD CONSTRAINT fcm_tokens_user_id_token_unique UNIQUE (user_id, token);
