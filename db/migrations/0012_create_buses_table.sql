-- Crear el tipo ENUM para el estado del autobús si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bus_estado') THEN
        CREATE TYPE public.bus_estado AS ENUM ('activo', 'inactivo', 'mantenimiento');
    END IF;
END$$;

-- Crear la tabla de autobuses
CREATE TABLE IF NOT EXISTS rutasegura.autobuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz(6) DEFAULT now() NOT NULL,
    matricula text NOT NULL,
    capacidad integer NOT NULL,
    imei_gps text NOT NULL,
    estado public.bus_estado NOT NULL,
    colegio_id uuid NOT NULL REFERENCES rutasegura.colegios(id) ON DELETE CASCADE,
    conductor_id uuid REFERENCES rutasegura.conductores(id) ON DELETE SET NULL,
    ruta_id uuid REFERENCES rutasegura.rutas(id) ON DELETE SET NULL,
    creado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Asegurar que la matrícula sea única por colegio
ALTER TABLE rutasegura.autobuses ADD CONSTRAINT autobuses_colegio_matricula_unique UNIQUE (colegio_id, matricula);

-- Asegurar que el IMEI sea único globalmente
ALTER TABLE rutasegura.autobuses ADD CONSTRAINT autobuses_imei_gps_unique UNIQUE (imei_gps);

-- Crear la vista para obtener datos relacionados fácilmente
CREATE OR REPLACE VIEW rutasegura.autobuses_view AS
SELECT
    a.id,
    a.matricula,
    a.capacidad,
    a.imei_gps,
    a.estado,
    a.colegio_id,
    col.nombre AS colegio_nombre,
    a.conductor_id,
    (cond.nombre || ' ' || cond.apellido) AS conductor_nombre,
    a.ruta_id,
    r.nombre AS ruta_nombre,
    a.creado_por
FROM
    rutasegura.autobuses a
LEFT JOIN
    rutasegura.colegios col ON a.colegio_id = col.id
LEFT JOIN
    rutasegura.conductores cond ON a.conductor_id = cond.id
LEFT JOIN
    rutasegura.rutas r ON a.ruta_id = r.id;

-- Habilitar RLS en la tabla
ALTER TABLE rutasegura.autobuses ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Permitir a los usuarios leer los autobuses de su propio colegio
CREATE POLICY "Allow read access to users of the same school"
ON rutasegura.autobuses
FOR SELECT
USING (
    colegio_id IN (
        SELECT colegio_id
        FROM rutasegura.profiles
        WHERE id = auth.uid()
    )
);

-- Permitir a los administradores (master, manager) leer todos los autobuses
CREATE POLICY "Allow admin read access"
ON rutasegura.autobuses
FOR SELECT
USING (
    (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);

-- Permitir a los usuarios crear, actualizar y eliminar autobuses de su propio colegio
CREATE POLICY "Allow full access for users of the same school"
ON rutasegura.autobuses
FOR ALL
USING (
    colegio_id IN (
        SELECT colegio_id
        FROM rutasegura.profiles
        WHERE id = auth.uid()
    )
);

-- Permitir a los administradores (master, manager) control total
CREATE POLICY "Allow admin full access"
ON rutasegura.autobuses
FOR ALL
USING (
    (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);
