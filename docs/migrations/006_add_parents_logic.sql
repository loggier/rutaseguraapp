-- Este script asegura que la tabla de perfiles (profiles) tenga la capacidad de
-- asociarse con un colegio. Esto es fundamental para que los usuarios con rol 'padre'
-- puedan ser vinculados al colegio de sus hijos.

-- 1. Agregar la columna `colegio_id` a la tabla `profiles` si no existe.
-- Esta columna almacenará el UUID del colegio al que pertenece el padre/tutor.
ALTER TABLE rutasegura.profiles
ADD COLUMN IF NOT EXISTS colegio_id UUID;

-- 2. Eliminar la restricción de clave foránea si ya existe, para evitar errores al volver a crearla.
ALTER TABLE rutasegura.profiles
DROP CONSTRAINT IF EXISTS profiles_colegio_id_fkey;

-- 3. Agregar la restricción de clave foránea (FOREIGN KEY).
-- Esto crea una relación formal entre `profiles` y `colegios`.
-- - `REFERENCES rutasegura.colegios(id)`: Asegura que el `colegio_id` debe corresponder a un `id` existente en la tabla `colegios`.
-- - `ON DELETE SET NULL`: Si un colegio es eliminado de la base de datos, el `colegio_id` de todos los padres/tutores
--   asociados se establecerá en `NULL` en lugar de eliminar el perfil del padre. Esto previene la pérdida de datos de los padres.
ALTER TABLE rutasegura.profiles
ADD CONSTRAINT profiles_colegio_id_fkey
FOREIGN KEY (colegio_id)
REFERENCES rutasegura.colegios(id)
ON DELETE SET NULL;

COMMENT ON COLUMN rutasegura.profiles.colegio_id IS 'Vincula un perfil (especialmente padres/tutores) a un colegio específico.';
