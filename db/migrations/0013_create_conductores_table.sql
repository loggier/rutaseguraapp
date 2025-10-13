-- Crear la tabla para los conductores
CREATE TABLE IF NOT EXISTS rutasegura.conductores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    licencia TEXT NOT NULL UNIQUE,
    telefono TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url TEXT,
    colegio_id UUID NOT NULL REFERENCES rutasegura.colegios(id) ON DELETE CASCADE,
    creado_por UUID REFERENCES rutasegura.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE rutasegura.conductores ENABLE ROW LEVEL SECURITY;

-- Crear políticas de RLS
CREATE POLICY "Los usuarios autenticados pueden ver los conductores"
ON rutasegura.conductores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Los administradores y managers pueden crear conductores"
ON rutasegura.conductores FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);

CREATE POLICY "Los usuarios de colegio pueden crear conductores para su propio colegio"
ON rutasegura.conductores FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio'
  AND colegio_id = (SELECT colegio_id FROM rutasegura.profiles WHERE id = auth.uid())
);

CREATE POLICY "Los administradores y managers pueden actualizar conductores"
ON rutasegura.conductores FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
)
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);

CREATE POLICY "Los usuarios de colegio pueden actualizar conductores de su propio colegio"
ON rutasegura.conductores FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio'
  AND colegio_id = (SELECT colegio_id FROM rutasegura.profiles WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio'
  AND colegio_id = (SELECT colegio_id FROM rutasegura.profiles WHERE id = auth.uid())
);

CREATE POLICY "Los administradores y managers pueden eliminar conductores"
ON rutasegura.conductores FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);

CREATE POLICY "Los usuarios de colegio pueden eliminar conductores de su propio colegio"
ON rutasegura.conductores FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio'
  AND colegio_id = (SELECT colegio_id FROM rutasegura.profiles WHERE id = auth.uid())
);

-- Vista para obtener datos de conductores con el nombre del colegio
CREATE OR REPLACE VIEW rutasegura.conductores_view AS
SELECT 
    c.*,
    col.nombre as colegio_nombre
FROM rutasegura.conductores c
LEFT JOIN rutasegura.colegios col ON c.colegio_id = col.id;
