-- Aseguramos que la extensión pgcrypto esté disponible en el schema public
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Eliminamos la función si existe para asegurar que se re-crea con la nueva definición
DROP FUNCTION IF EXISTS rutasegura.verify_password;

-- Creamos la función para verificar la contraseña dentro de nuestro schema
CREATE OR REPLACE FUNCTION rutasegura.verify_password(password_param TEXT, hash_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Comparamos el hash almacenado con el resultado de encriptar la contraseña proporcionada.
  -- Se especifica public.crypt para evitar problemas con el search_path del schema.
  RETURN hash_param = public.crypt(password_param, hash_param);
END;
$$ LANGUAGE plpgsql;
