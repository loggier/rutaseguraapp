-- Elimina la tabla si existe para asegurar un estado limpio.
DROP TABLE IF EXISTS rutasegura.ruta_estudiantes;

-- Crea la tabla que conecta rutas, estudiantes y sus paradas específicas.
CREATE TABLE rutasegura.ruta_estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruta_id UUID NOT NULL REFERENCES rutasegura.rutas(id) ON DELETE CASCADE,
    estudiante_id UUID NOT NULL REFERENCES rutasegura.estudiantes(id) ON DELETE CASCADE,
    parada_id UUID NOT NULL REFERENCES rutasegura.paradas(id) ON DELETE CASCADE,
    
    agregado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un estudiante solo puede estar una vez en la misma ruta.
    -- La parada específica puede cambiar, pero no puede estar dos veces en la misma ruta.
    UNIQUE(ruta_id, estudiante_id)
);

-- Habilita la seguridad a nivel de fila
ALTER TABLE rutasegura.ruta_estudiantes ENABLE ROW LEVEL SECURITY;

-- Otorga permisos básicos a los usuarios autenticados.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rutasegura.ruta_estudiantes TO authenticated;

-- Políticas de seguridad (RLS)
-- Los usuarios pueden ver las relaciones de su propio colegio (lógica a implementar via funciones).
-- Por ahora, se permite el acceso general a los usuarios autenticados para desarrollo.

CREATE POLICY "Permitir acceso completo a usuarios autenticados"
ON rutasegura.ruta_estudiantes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
