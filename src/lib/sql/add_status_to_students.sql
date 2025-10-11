-- Este script añade una columna 'activo' a la tabla de estudiantes para poder gestionar su estado.

ALTER TABLE rutasegura.estudiantes
ADD COLUMN activo BOOLEAN DEFAULT true;

-- Opcional: Actualizar todos los estudiantes existentes para que tengan un estado inicial.
UPDATE rutasegura.estudiantes
SET activo = true
WHERE activo IS NULL;
