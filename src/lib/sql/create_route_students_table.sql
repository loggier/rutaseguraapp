
-- Tabla para la relación muchos a muchos entre rutas y estudiantes
CREATE TABLE IF NOT EXISTS rutasegura.ruta_estudiantes (
    ruta_id UUID NOT NULL REFERENCES rutasegura.rutas(id) ON DELETE CASCADE,
    estudiante_id UUID NOT NULL REFERENCES rutasegura.estudiantes(id) ON DELETE CASCADE,
    
    -- La parada específica que usará el estudiante para esta ruta
    parada_id UUID NOT NULL REFERENCES rutasegura.paradas(id) ON DELETE RESTRICT, 

    -- Metadatos de la asignación
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    asignado_por UUID REFERENCES rutasegura.users(id),

    PRIMARY KEY (ruta_id, estudiante_id)
);

-- Índices para mejorar el rendimiento de las búsquedas
CREATE INDEX IF NOT EXISTS idx_ruta_estudiantes_ruta_id ON rutasegura.ruta_estudiantes(ruta_id);
CREATE INDEX IF NOT EXISTS idx_ruta_estudiantes_estudiante_id ON rutasegura.ruta_estudiantes(estudiante_id);

COMMENT ON TABLE rutasegura.ruta_estudiantes IS 'Tabla de asociación para vincular estudiantes a rutas específicas.';
COMMENT ON COLUMN rutasegura.ruta_estudiantes.parada_id IS 'La parada (de recogida o entrega) que el estudiante usará en esta ruta específica.';
