-- Tabla para almacenar las paradas de los estudiantes
CREATE TABLE rutasegura.paradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES rutasegura.estudiantes(id) ON DELETE CASCADE,
    colegio_id UUID NOT NULL REFERENCES rutasegura.colegios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('Recogida', 'Entrega')),
    direccion TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ,

    -- Un estudiante solo puede tener una parada de cada tipo
    UNIQUE (estudiante_id, tipo)
);

-- Trigger para actualizar el campo 'actualizado_en' en cada actualización
CREATE OR REPLACE FUNCTION rutasegura.set_paradas_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_paradas_actualizado_en
BEFORE UPDATE ON rutasegura.paradas
FOR EACH ROW
EXECUTE FUNCTION rutasegura.set_paradas_actualizado_en();

-- Políticas de RLS (Row Level Security) para la tabla de paradas
ALTER TABLE rutasegura.paradas ENABLE ROW LEVEL SECURITY;

-- Por ahora, se permite el acceso público para lectura y escritura,
-- esto deberá ajustarse a la lógica de negocio real de su aplicación.
-- Por ejemplo, un padre solo debería poder ver las paradas de su hijo.
CREATE POLICY "Permitir acceso a todos por ahora"
ON rutasegura.paradas
FOR ALL
USING (true)
WITH CHECK (true);
