
-- Añade las nuevas columnas a la tabla de perfiles si no existen.
-- Son opcionales para no afectar a los perfiles existentes (master, manager, colegio).

ALTER TABLE rutasegura.profiles
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS email_adicional TEXT;

-- Comentario para describir los nuevos campos.
COMMENT ON COLUMN rutasegura.profiles.telefono IS 'Número de teléfono de contacto para padres/tutores.';
COMMENT ON COLUMN rutasegura.profiles.direccion IS 'Dirección de residencia para padres/tutores.';
COMMENT ON COLUMN rutasegura.profiles.email_adicional IS 'Un correo electrónico secundario para padres/tutores.';
