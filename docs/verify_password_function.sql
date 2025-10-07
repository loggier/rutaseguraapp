-- docs/verify_password_function.sql

-- Este script crea la función de PostgreSQL necesaria para verificar
-- una contraseña en texto plano contra un hash almacenado usando pgcrypto.

-- Paso 1: Asegurarse de que la extensión pgcrypto esté habilitada.
-- Supabase la tiene habilitada por defecto en nuevas bases de datos, pero es buena práctica asegurarlo.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Paso 2: Crear la función en el schema 'rutasegura'.
-- La función toma la contraseña enviada por el usuario y el hash guardado en la BD.
CREATE OR REPLACE FUNCTION rutasegura.verify_password(password_param TEXT, hash_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con los permisos del creador para acceder a `crypt`
AS $$
BEGIN
  -- La función crypt() de pgcrypto se usa tanto para crear un hash como para verificarlo.
  -- Cuando se le pasa el hash existente como segundo argumento, lo usa como "salt"
  -- para encriptar la contraseña de entrada y compara los resultados.
  RETURN hash_param = crypt(password_param, hash_param);
END;
$$;

-- Paso 3: Otorgar permisos de ejecución a los roles necesarios.
-- Damos permiso al rol 'service_role' que es el que usará nuestra API de login para llamar a esta función.
-- También se puede dar a 'anon' y 'authenticated' si fuera necesario desde el cliente, pero es más seguro desde el backend.
GRANT EXECUTE ON FUNCTION rutasegura.verify_password(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION rutasegura.verify_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rutasegura.verify_password(TEXT, TEXT) TO anon;
