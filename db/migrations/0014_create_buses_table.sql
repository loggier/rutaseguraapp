-- Crear la tabla para los autobuses
CREATE TABLE IF NOT EXISTS rutasegura.autobuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT NOT NULL UNIQUE,
    capacidad INTEGER NOT NULL,
    imei_gps TEXT NOT NULL UNIQUE,
    estado TEXT NOT NULL DEFAULT 'activo', -- activo, inactivo, mantenimiento
    colegio_id UUID NOT NULL REFERENCES rutasegura.colegios(id) ON DELETE CASCADE,
    conductor_id UUID REFERENCES rutasegura.conductores(id) ON DELETE SET NULL,
    ruta_id UUID REFERENCES rutasegura.rutas(id) ON DELETE SET NULL,
    creado_por UUID REFERENCES rutasegura.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE rutasegura.autobuses ENABLE ROW LEVEL SECURITY;

-- Crear políticas de RLS
CREATE POLICY "Los usuarios autenticados pueden ver los autobuses"
ON rutasegura.autobuses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Los administradores y managers pueden crear autobuses"
ON rutasegura.autobuses FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);

CREATE POLICY "Los usuarios de colegio pueden crear autobuses para su propio colegio"
ON rutasegura.autobuses FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio'
  AND colegio_id = (SELECT colegio_id FROM rutasegura.profiles WHERE id = auth.uid())
);

CREATE POLICY "Los administradores y managers pueden actualizar autobuses"
ON rutasegura.autobuses FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
)
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);

CREATE POLICY "Los usuarios de colegio pueden actualizar autobuses de su propio colegio"
ON rutasegura.autobuses FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio'
  AND colegio_id = (SELECT colegio_id FROM rutasegura.profiles WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio'
  AND colegio_id = (SELECT colegio_id FROM rutasegura.profiles WHERE id = auth.uid())
);

CREATE POLICY "Los administradores y managers pueden eliminar autobuses"
ON rutasegura.autobuses FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);

CREATE POLICY "Los usuarios de colegio pueden eliminar autobuses de su propio colegio"
ON rutasegura.autobuses FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio'
  AND colegio_id = (SELECT colegio_id FROM rutasegura.profiles WHERE id = auth.uid())
);

-- Vista para obtener datos de autobuses con nombres de relaciones
CREATE OR REPLACE VIEW rutasegura.autobuses_view AS
SELECT 
    a.*,
    col.nombre as colegio_nombre,
    cond.nombre || ' ' || cond.apellido as conductor_nombre,
    r.nombre as ruta_nombre
FROM rutasegura.autobuses a
LEFT JOIN rutasegura.colegios col ON a.colegio_id = col.id
LEFT JOIN rutasegura.conductores cond ON a.conductor_id = cond.id
LEFT JOIN rutasegura.rutas r ON a.ruta_id = r.id;
