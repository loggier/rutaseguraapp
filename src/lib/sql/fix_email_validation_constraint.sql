-- Este script corrige la restricción de validación de email en la tabla 'estudiantes'.
-- La restricción original no permitía cadenas vacías (''), lo cual causaba errores
-- al intentar guardar un estudiante sin un email opcional.

-- Paso 1: Eliminar la restricción de validación de email existente.
ALTER TABLE rutasegura.estudiantes
DROP CONSTRAINT IF EXISTS email_validation;

-- Paso 2: Agregar una nueva restricción que permita valores NULL, cadenas vacías ('') o
-- un formato de email válido. Esto asegura que el campo opcional funcione como se espera.
ALTER TABLE rutasegura.estudiantes
ADD CONSTRAINT email_validation
CHECK (email IS NULL OR email = '' OR email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
