
-- Junction table to link students and their specific stops to routes
CREATE TABLE IF NOT EXISTS rutasegura.ruta_estudiantes (
    ruta_id UUID REFERENCES rutasegura.rutas(id) ON DELETE CASCADE,
    estudiante_id UUID REFERENCES rutasegura.estudiantes(id) ON DELETE CASCADE,
    parada_id UUID REFERENCES rutasegura.paradas(id) ON DELETE CASCADE,
    -- A student can only be on a route once with a specific stop
    PRIMARY KEY (ruta_id, estudiante_id, parada_id) 
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ruta_estudiantes_ruta_id ON rutasegura.ruta_estudiantes(ruta_id);
CREATE INDEX IF NOT EXISTS idx_ruta_estudiantes_estudiante_id ON rutasegura.ruta_estudiantes(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_ruta_estudiantes_parada_id ON rutasegura.ruta_estudiantes(parada_id);

-- This allows us to easily count students per route
CREATE OR REPLACE VIEW rutasegura.ruta_estudiante_counts AS
SELECT
    ruta_id,
    count(DISTINCT estudiante_id) AS estudiantes_count
FROM
    rutasegura.ruta_estudiantes
GROUP BY
    ruta_id;

-- RLS Policies for ruta_estudiantes
ALTER TABLE rutasegura.ruta_estudiantes ENABLE ROW LEVEL SECURITY;

-- Allow users to see students in routes related to their school
-- For master/manager
CREATE POLICY "Allow master and manager to see all route students"
    ON rutasegura.ruta_estudiantes FOR SELECT
    TO authenticated
    USING (
        (get_my_claim('user_role'::text)) = '"master"'::jsonb OR
        (get_my_claim('user_role'::text)) = '"manager"'::jsonb
    );

-- For 'colegio' role
CREATE POLICY "Allow colegio to see students in their routes"
    ON rutasegura.ruta_estudiantes FOR SELECT
    TO authenticated
    USING (
        (get_my_claim('user_role'::text)) = '"colegio"'::jsonb AND
        EXISTS (
            SELECT 1 FROM rutasegura.rutas r
            WHERE r.id = ruta_id AND r.colegio_id = (SELECT get_my_colegio_id())
        )
    );

-- Allow master/manager to manage all route_students
CREATE POLICY "Allow master and manager to manage all route students"
    ON rutasegura.ruta_estudiantes FOR ALL
    TO authenticated
    USING (
        (get_my_claim('user_role'::text)) = '"master"'::jsonb OR
        (get_my_claim('user_role'::text)) = '"manager"'::jsonb
    )
    WITH CHECK (
        (get_my_claim('user_role'::text)) = '"master"'::jsonb OR
        (get_my_claim('user_role'::text)) = '"manager"'::jsonb
    );

-- Allow 'colegio' role to manage their own route_students
CREATE POLICY "Allow colegio to manage their own route students"
    ON rutasegura.ruta_estudiantes FOR ALL
    TO authenticated
    USING (
        (get_my_claim('user_role'::text)) = '"colegio"'::jsonb AND
        EXISTS (
            SELECT 1 FROM rutasegura.rutas r
            WHERE r.id = ruta_id AND r.colegio_id = (SELECT get_my_colegio_id())
        )
    )
    WITH CHECK (
        (get_my_claim('user_role'::text)) = '"colegio"'::jsonb AND
        EXISTS (
            SELECT 1 FROM rutasegura.rutas r
            WHERE r.id = ruta_id AND r.colegio_id = (SELECT get_my_colegio_id())
        )
    );
