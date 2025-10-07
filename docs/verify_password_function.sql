-- docs/verify_password_function.sql

-- Habilitamos la extensión pgcrypto si no está habilitada.
-- Es necesario ser superusuario para ejecutar esto la primera vez.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Creamos la función para verificar la contraseña
-- Esta función compara una contraseña en texto plano con un hash existente.
CREATE OR REPLACE FUNCTION rutasegura.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- La función crypt() genera un hash con una "sal" y lo compara con el hash existente.
  -- Si la contraseña es correcta, el nuevo hash generado coincidirá con el hash guardado.
  RETURN hash = crypt(password, hash);
END;
$$;
