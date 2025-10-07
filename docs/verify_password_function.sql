-- docs/verify_password_function.sql

-- Esta función toma una contraseña en texto plano y un hash almacenado,
-- y devuelve true si la contraseña coincide con el hash, usando la función crypt.
-- Esto permite que nuestra API de backend verifique contraseñas de forma segura
-- sin exponer la lógica de encriptación ni los hashes fuera de la base de datos.

CREATE OR REPLACE FUNCTION rutasegura.verify_password(password_param text, hash_param text)
RETURNS boolean AS $$
BEGIN
  RETURN hash_param = crypt(password_param, hash_param);
END;
$$ LANGUAGE plpgsql;

-- Otorgamos permiso al rol 'service_role' para ejecutar esta función.
-- Esto es crucial para que nuestro backend, usando la SUPABASE_SERVICE_ROLE_KEY,
-- pueda llamar a esta función.
GRANT EXECUTE ON FUNCTION rutasegura.verify_password(text, text) TO service_role;
