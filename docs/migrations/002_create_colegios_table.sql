
-- Habilita la extensión pgcrypto si aún no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creación de la tabla para los colegios
CREATE TABLE IF NOT EXISTS rutasegura.colegios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    ruc VARCHAR(13) UNIQUE NOT NULL,
    email_contacto VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    direccion TEXT,
    codigo_postal VARCHAR(10),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to the user who represents this school
    usuario_id UUID NOT NULL REFERENCES rutasegura.users(id) ON DELETE CASCADE,
    
    -- Foreign key to the manager/master user who created this school record
    creado_por UUID NOT NULL REFERENCES rutasegura.users(id)
);

-- Índices para mejorar el rendimiento de las búsquedas
CREATE INDEX IF NOT EXISTS idx_colegios_creado_por ON rutasegura.colegios(creado_por);
CREATE INDEX IF NOT EXISTS idx_colegios_usuario_id ON rutasegura.colegios(usuario_id);

-- Comentarios en la tabla y columnas para mayor claridad
COMMENT ON TABLE rutasegura.colegios IS 'Almacena la información de las instituciones educativas (colegios) que son clientes.';
COMMENT ON COLUMN rutasegura.colegios.id IS 'Identificador único para cada colegio.';
COMMENT ON COLUMN rutasegura.colegios.nombre IS 'Nombre comercial o legal del colegio.';
COMMENT ON COLUMN rutasegura.colegios.ruc IS 'Registro Único de Contribuyentes (RUC) del colegio en Ecuador.';
COMMENT ON COLUMN rutasegura.colegios.email_contacto IS 'Correo electrónico principal de contacto del colegio.';
COMMENT ON COLUMN rutasegura.colegios.telefono IS 'Número de teléfono de contacto del colegio.';
COMMENT ON COLUMN rutasegura.colegios.direccion IS 'Dirección física completa del colegio.';
COMMENT ON COLUMN rutasegura.colegios.codigo_postal IS 'Código postal de la ubicación del colegio.';
COMMENT ON COLUMN rutasegura.colegios.creado_en IS 'Fecha y hora de creación del registro del colegio.';
COMMENT ON COLUMN rutasegura.colegios.usuario_id IS 'Referencia al usuario de tipo "colegio" que tiene las credenciales de acceso.';
COMMENT ON COLUMN rutasegura.colegios.creado_por IS 'Referencia al usuario (master/manager) que registró el colegio en el sistema.';

    