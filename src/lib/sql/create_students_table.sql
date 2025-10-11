-- src/lib/sql/create_students_table.sql

-- Habilitar la extensión si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla para almacenar los datos de los estudiantes
CREATE TABLE IF NOT EXISTS rutasegura.estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(10) UNIQUE NOT NULL, -- ID legible para el usuario
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT true NOT NULL,
    avatar_url TEXT,
    
    colegio_id UUID NOT NULL,
    padre_id UUID NOT NULL,
    creado_por UUID NOT NULL,
    
    fecha_creacion TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    CONSTRAINT fk_colegio
      FOREIGN KEY(colegio_id) 
      REFERENCES rutasegura.colegios(id)
      ON DELETE CASCADE, -- Si se elimina el colegio, se eliminan sus estudiantes

    CONSTRAINT fk_padre
      FOREIGN KEY(padre_id) 
      REFERENCES rutasegura.profiles(id)
      ON DELETE RESTRICT, -- No permitir eliminar un padre si tiene estudiantes asignados
      
    CONSTRAINT fk_creador
      FOREIGN KEY(creado_por)
      REFERENCES rutasegura.users(id)
);

-- Comentarios para la tabla y columnas
COMMENT ON TABLE rutasegura.estudiantes IS 'Almacena la información de los estudiantes.';
COMMENT ON COLUMN rutasegura.estudiantes.student_id IS 'ID único y legible para el estudiante, generado por la aplicación.';
COMMENT ON COLUMN rutasegura.estudiantes.padre_id IS 'Referencia al padre o tutor principal del estudiante.';
COMMENT ON COLUMN rutasegura.estudiantes.colegio_id IS 'Colegio al que pertenece el estudiante.';
COMMENT ON COLUMN rutasegura.estudiantes.creado_por IS 'Usuario que creó el registro del estudiante.';

-- Índices para mejorar el rendimiento de las búsquedas
CREATE INDEX IF NOT EXISTS idx_estudiantes_colegio_id ON rutasegura.estudiantes(colegio_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_padre_id ON rutasegura.estudiantes(padre_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_nombre_apellido ON rutasegura.estudiantes(apellido, nombre);
