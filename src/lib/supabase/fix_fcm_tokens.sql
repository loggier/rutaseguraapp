-- SCRIPT DE CORRECCIÓN PARA LA TABLA fcm_tokens
-- Este script ajusta la tabla `fcm_tokens` para permitir que un usuario tenga
-- múltiples tokens de dispositivo, pero evita que se inserte la misma
-- combinación de (user_id, token) más de una vez.

-- Es seguro ejecutar este script varias veces.

-- 1. Elimina las antiguas restricciones de unicidad que podrían causar conflictos.
--    (Ej: una restricción que solo permitía un token por usuario o un token único global)
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_key;
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_token_key;
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_token_unique;

-- 2. Asegúrate de que la referencia de clave foránea apunte a la tabla correcta.
--    (Corrige el problema de apuntar a `auth.users` en lugar de `rutasegura.users`)
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_fkey;

ALTER TABLE rutasegura.fcm_tokens
ADD CONSTRAINT fcm_tokens_user_id_fkey
FOREIGN KEY (user_id) REFERENCES rutasegura.users(id) ON DELETE CASCADE;

-- 3. Añade la nueva restricción de unicidad compuesta.
--    Esto asegura que no se pueda registrar el mismo token para el mismo usuario dos veces.
--    La API utiliza esta restricción para el comando `upsert`.
ALTER TABLE rutasegura.fcm_tokens ADD CONSTRAINT fcm_tokens_user_id_token_unique UNIQUE (user_id, token);
