-- Script to create the 'estudiantes' table and set up its relationships

-- 1. Create the 'estudiantes' table
CREATE TABLE IF NOT EXISTS rutasegura.estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    student_id VARCHAR(6) NOT NULL UNIQUE,
    email TEXT,
    telefono TEXT,
    colegio_id UUID NOT NULL,
    padre_id UUID NOT NULL,
    creado_por UUID NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT email_validation CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
);

-- 2. Add foreign key constraint for 'colegio_id' to 'colegios' table
-- This ensures a student is always linked to an existing school.
-- If a school is deleted, all its students are also deleted (CASCADE).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_estudiantes_colegio' AND conrelid = 'rutasegura.estudiantes'::regclass
    ) THEN
        ALTER TABLE rutasegura.estudiantes
        ADD CONSTRAINT fk_estudiantes_colegio
        FOREIGN KEY (colegio_id)
        REFERENCES rutasegura.colegios(id)
        ON DELETE CASCADE;
    END IF;
END;
$$;


-- 3. Add foreign key constraint for 'padre_id' to 'profiles' table
-- This ensures a student is always linked to an existing parent/tutor profile.
-- If a parent profile is deleted, all their associated students are also deleted (CASCADE).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_estudiantes_padre' AND conrelid = 'rutasegura.estudiantes'::regclass
    ) THEN
        ALTER TABLE rutasegura.estudiantes
        ADD CONSTRAINT fk_estudiantes_padre
        FOREIGN KEY (padre_id)
        REFERENCES rutasegura.profiles(id)
        ON DELETE CASCADE;
    END IF;
END;
$$;


-- 4. Add foreign key constraint for 'creado_por' to 'users' table
-- This tracks which user created the student record.
-- If the creating user is deleted, the 'creado_por' field is set to NULL.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_estudiantes_creador' AND conrelid = 'rutasegura.estudiantes'::regclass
    ) THEN
        ALTER TABLE rutasegura.estudiantes
        ADD CONSTRAINT fk_estudiantes_creador
        FOREIGN KEY (creado_por)
        REFERENCES rutasegura.users(id)
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- Add comments to tables and columns for better understanding
COMMENT ON TABLE rutasegura.estudiantes IS 'Stores student profiles and their associations.';
COMMENT ON COLUMN rutasegura.estudiantes.student_id IS 'Unique 6-digit identifier for the student.';
COMMENT ON COLUMN rutasegura.estudiantes.colegio_id IS 'Foreign key to the school the student belongs to.';
COMMENT ON COLUMN rutasegura.estudiantes.padre_id IS 'Foreign key to the parent/tutor profile responsible for the student.';
COMMENT ON COLUMN rutasegura.estudiantes.creado_por IS 'Foreign key to the user who created this student record.';
