-- Este archivo ya no es necesario, pero se mantiene para referencia histórica.
-- La lógica correcta ahora está en el README.md principal.

-- SCRIPT DE CORRECCIÓN (Si tenías la configuración de "un solo token por usuario")
-- Esto migra la tabla a la configuración de "múltiples tokens por usuario, sin duplicados".

-- 1. Elimina la antigua restricción de unicidad del user_id (si existe).
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_key;

-- 2. Elimina otras posibles restricciones de unicidad que puedan entrar en conflicto.
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_token_key;

-- 3. Elimina la restricción de unicidad compuesta incorrecta si existe.
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_token_unique;

-- 4. Añade la nueva restricción de unicidad compuesta correcta.
-- Esto asegura que no se pueda insertar el mismo token para el mismo usuario dos veces.
ALTER TABLE rutasegura.fcm_tokens ADD CONSTRAINT fcm_tokens_user_id_token_unique UNIQUE (user_id, token);

-- 5. Corrige la referencia de la clave foránea para que apunte a `rutasegura.users`.
ALTER TABLE rutasegura.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_fkey;
ALTER TABLE rutasegura.fcm_tokens 
ADD CONSTRAINT fcm_tokens_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES rutasegura.users(id) ON DELETE CASCADE;
