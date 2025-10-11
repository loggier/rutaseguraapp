
-- Tabla para almacenar las rutas
CREATE TABLE IF NOT EXISTS rutasegura.rutas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    turno TEXT NOT NULL, -- 'Recogida' o 'Entrega'
    hora_salida TIME NOT NULL,
    colegio_id UUID NOT NULL REFERENCES rutasegura.colegios(id) ON DELETE CASCADE,
    creado_por UUID NOT NULL REFERENCES rutasegura.users(id),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Una ruta debe tener un nombre único por colegio
    UNIQUE(colegio_id, nombre)
);

-- Tabla para la relación muchos-a-muchos entre rutas y estudiantes
CREATE TABLE IF NOT EXISTS rutasegura.ruta_estudiantes (
    ruta_id UUID NOT NULL REFERENCES rutasegura.rutas(id) ON DELETE CASCADE,
    estudiante_id UUID NOT NULL REFERENCES rutasegura.estudiantes(id) ON DELETE CASCADE,
    
    -- La combinación de ruta y estudiante debe ser única
    PRIMARY KEY (ruta_id, estudiante_id)
);
