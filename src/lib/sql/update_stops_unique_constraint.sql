-- 1. Eliminar la restricción de unicidad antigua que solo consideraba (estudiante_id, tipo)
ALTER TABLE rutasegura.paradas
DROP CONSTRAINT IF EXISTS paradas_estudiante_id_tipo_key;

-- 2. Añadir una nueva restricción de unicidad que considere (estudiante_id, tipo, sub_tipo)
-- Esto permite que un estudiante tenga, por ejemplo, una parada de 'Recogida'/'Principal' y otra de 'Recogida'/'Familiar/Academia'.
ALTER TABLE rutasegura.paradas
ADD CONSTRAINT paradas_estudiante_id_tipo_sub_tipo_key UNIQUE (estudiante_id, tipo, sub_tipo);
