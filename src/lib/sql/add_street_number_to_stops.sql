-- Add new enum type for sub_tipo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_tipo_parada') THEN
        CREATE TYPE rutasegura.sub_tipo_parada AS ENUM ('Principal', 'Familiar/Academia');
    END IF;
END$$;

-- Add sub_tipo column to paradas table
ALTER TABLE rutasegura.paradas
ADD COLUMN IF NOT EXISTS sub_tipo rutasegura.sub_tipo_parada NOT NULL DEFAULT 'Principal';

-- Add calle column to paradas table
ALTER TABLE rutasegura.paradas
ADD COLUMN IF NOT EXISTS calle TEXT;

-- Add numero column to paradas table
ALTER TABLE rutasegura.paradas
ADD COLUMN IF NOT EXISTS numero TEXT;
