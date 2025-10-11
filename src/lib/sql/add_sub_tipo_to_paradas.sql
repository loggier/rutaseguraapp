-- Agrega la columna sub_tipo a la tabla de paradas.
-- Esta columna diferenciará entre la parada principal del estudiante y otras paradas (ej. casa de un familiar, academia).
-- Se establece un valor por defecto 'Principal' para las paradas existentes.

ALTER TABLE IF EXISTS rutasegura.paradas
ADD COLUMN IF NOT EXISTS sub_tipo TEXT NOT NULL DEFAULT 'Principal';
