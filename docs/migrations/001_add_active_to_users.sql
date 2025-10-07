-- Añade la columna `activo` a la tabla `users`.
-- Esta columna se utilizará para activar o desactivar usuarios sin eliminarlos.

ALTER TABLE rutasegura.users
ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN rutasegura.users.activo IS 'Indica si el usuario está activo (true) o inactivo (false). Los usuarios inactivos no pueden iniciar sesión.';
