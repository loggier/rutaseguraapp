
-- Drop the table if it exists to ensure a clean slate
DROP TABLE IF EXISTS rutasegura.ruta_estudiantes;

-- Create the table to link students to specific routes
CREATE TABLE rutasegura.ruta_estudiantes (
    ruta_id uuid NOT NULL,
    estudiante_id uuid NOT NULL,
    parada_id uuid NOT NULL,
    
    -- Timestamps for creation and last update
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Define foreign key constraints
    CONSTRAINT fk_ruta
        FOREIGN KEY(ruta_id) 
        REFERENCES rutasegura.rutas(id)
        ON DELETE CASCADE, -- If a route is deleted, remove its student assignments
    
    CONSTRAINT fk_estudiante
        FOREIGN KEY(estudiante_id) 
        REFERENCES rutasegura.estudiantes(id)
        ON DELETE CASCADE, -- If a student is deleted, remove them from routes
        
    CONSTRAINT fk_parada
        FOREIGN KEY(parada_id) 
        REFERENCES rutasegura.paradas(id)
        ON DELETE CASCADE, -- If a stop is deleted, this link becomes invalid

    -- Define the primary key
    -- A student can only be on a route once
    PRIMARY KEY (ruta_id, estudiante_id)
);

-- Add a unique constraint to ensure a stop is only used once per route
ALTER TABLE rutasegura.ruta_estudiantes
ADD CONSTRAINT unique_ruta_parada UNIQUE (ruta_id, parada_id);

-- Add comments to explain the purpose of the table and columns
COMMENT ON TABLE rutasegura.ruta_estudiantes IS 'Tabla de unión para asignar estudiantes a rutas específicas.';
COMMENT ON COLUMN rutasegura.ruta_estudiantes.ruta_id IS 'ID de la ruta a la que se asigna el estudiante.';
COMMENT ON COLUMN rutasegura.ruta_estudiantes.estudiante_id IS 'ID del estudiante asignado a la ruta.';
COMMENT ON COLUMN rutasegura.ruta_estudiantes.parada_id IS 'ID de la parada específica del estudiante que se usará en esta ruta.';

-- Enable Row Level Security
ALTER TABLE rutasegura.ruta_estudiantes ENABLE ROW LEVEL SECURITY;

-- Create policies for data access
-- Allow users with appropriate roles to read all data
CREATE POLICY "Allow read access to all users"
ON rutasegura.ruta_estudiantes
FOR SELECT
USING (true);

-- Allow users with appropriate roles to insert, update, and delete
CREATE POLICY "Allow full access to master and manager roles"
ON rutasegura.ruta_estudiantes
FOR ALL
USING (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
)
WITH CHECK (
  (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) IN ('master', 'manager')
);

CREATE POLICY "Allow colegio role to manage their own routes"
ON rutasegura.ruta_estudiantes
FOR ALL
USING (
    (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio' AND
    (
        ruta_id IN (
            SELECT r.id FROM rutasegura.rutas r
            JOIN rutasegura.colegios c ON r.colegio_id = c.id
            WHERE c.usuario_id = auth.uid()
        )
    )
)
WITH CHECK (
     (SELECT rol FROM rutasegura.profiles WHERE id = auth.uid()) = 'colegio' AND
    (
        ruta_id IN (
            SELECT r.id FROM rutasegura.rutas r
            JOIN rutasegura.colegios c ON r.colegio_id = c.id
            WHERE c.usuario_id = auth.uid()
        )
    )
);
