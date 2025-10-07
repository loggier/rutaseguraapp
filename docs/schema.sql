-- Aseguramos que el schema existe
CREATE SCHEMA IF NOT EXISTS rutasegura;

-- Habilitamos la extensión pgcrypto si no existe (necesaria para crypt())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Borramos cualquier tabla o tipo existente para empezar de cero
DROP TABLE IF EXISTS rutasegura.permissions CASCADE;
DROP TABLE IF EXISTS rutasegura.profiles CASCADE;
DROP TABLE IF EXISTS rutasegura.users CASCADE; -- Se borra la nueva tabla users
DROP TYPE IF EXISTS rutasegura.user_role CASCADE;
DROP TYPE IF EXISTS rutasegura.module CASCADE;


-- ****************
-- 1. CREACIÓN DE TIPOS Y TABLAS
-- ****************

-- 1. Creamos un tipo ENUM para los roles de usuario.
CREATE TYPE rutasegura.user_role AS ENUM (
  'master',
  'manager',
  'colegio',
  'padre'
);

-- 2. Creamos la tabla de usuarios (users) para credenciales
CREATE TABLE rutasegura.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Almacenará el hash de la contraseña
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Creamos la tabla de perfiles (profiles) para datos adicionales.
CREATE TABLE rutasegura.profiles (
  id UUID PRIMARY KEY REFERENCES rutasegura.users(id) ON DELETE CASCADE,
  nombre TEXT,
  apellido TEXT,
  rol rutasegura.user_role NOT NULL DEFAULT 'padre',
  avatar_url TEXT,
  updated_at TIMESTAMPTZ
);


-- 4. Creamos un tipo ENUM para los módulos de la aplicación.
CREATE TYPE rutasegura.module AS ENUM (
  'dashboard',
  'users',
  'estudiantes',
  'conductores',
  'autobuses',
  'rutas',
  'tracking',
  'optimizar_ruta',
  'planes',
  'configuracion'
);

-- 5. Creamos la tabla de permisos (permissions).
CREATE TABLE rutasegura.permissions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  rol rutasegura.user_role NOT NULL,
  modulo rutasegura.module NOT NULL,
  puede_ver BOOLEAN DEFAULT false,
  puede_crear BOOLEAN DEFAULT false,
  puede_editar BOOLEAN DEFAULT false,
  puede_eliminar BOOLEAN DEFAULT false,
  UNIQUE (rol, modulo) 
);


-- ****************
-- 2. PRIVILEGIOS Y RLS
-- ****************

-- Concedemos uso del schema
GRANT USAGE ON SCHEMA rutasegura TO anon, authenticated, service_role;

-- Concedemos permisos sobre las tablas al rol service_role (usado por el servidor)
GRANT ALL ON TABLE rutasegura.users TO service_role;
GRANT ALL ON TABLE rutasegura.profiles TO service_role;
GRANT ALL ON TABLE rutasegura.permissions TO service_role;

-- Por ahora, permitimos acceso amplio para anon y authenticated para simplificar el desarrollo inicial.
-- La seguridad real vendrá de las llamadas a la API validadas.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rutasegura.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rutasegura.profiles TO anon, authenticated;
GRANT SELECT ON TABLE rutasegura.permissions TO anon, authenticated;


-- ****************
-- 3. FUNCIONES, TRIGGERS E INSERCIONES
-- ****************

-- Función para manejar el 'updated_at' en profiles
CREATE OR REPLACE FUNCTION rutasegura.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON rutasegura.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE rutasegura.handle_updated_at();
  
-- Función para verificar la contraseña
CREATE OR REPLACE FUNCTION rutasegura.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$$;


-- Inserción del usuario master
DO $$
DECLARE
  master_user_id UUID;
BEGIN
  -- Insertar en la tabla de usuarios y obtener el ID generado
  INSERT INTO rutasegura.users (email, password)
  VALUES ('master@rutasegura.com', crypt('Martes13', gen_salt('bf')))
  RETURNING id INTO master_user_id;

  -- Insertar en la tabla de perfiles usando el ID del usuario
  INSERT INTO rutasegura.profiles (id, nombre, apellido, rol)
  VALUES (master_user_id, 'Master', 'Admin', 'master');
END $$;


-- Insertamos los permisos iniciales
INSERT INTO rutasegura.permissions (rol, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
  ('master', 'dashboard', true, true, true, true),
  ('master', 'users', true, true, true, true),
  ('master', 'estudiantes', true, true, true, true),
  ('master', 'conductores', true, true, true, true),
  ('master', 'autobuses', true, true, true, true),
  ('master', 'rutas', true, true, true, true),
  ('master', 'tracking', true, true, true, true),
  ('master', 'optimizar_ruta', true, true, true, true),
  ('master', 'planes', true, true, true, true),
  ('master', 'configuracion', true, true, true, true),
  ('manager', 'dashboard', true, false, false, false),
  ('manager', 'estudiantes', true, true, true, true),
  ('manager', 'conductores', true, true, true, true),
  ('manager', 'autobuses', true, true, true, true),
  ('manager', 'rutas', true, true, true, true),
  ('manager', 'tracking', true, false, false, false),
  ('manager', 'optimizar_ruta', true, false, false, false),
  ('manager', 'planes', false, false, false, false),
  ('manager', 'configuracion', true, false, true, false),
  ('colegio', 'dashboard', true, false, false, false),
  ('colegio', 'estudiantes', true, true, true, false),
  ('colegio', 'conductores', true, false, false, false),
  ('colegio', 'autobuses', true, false, false, false),
  ('colegio', 'rutas', true, false, false, false),
  ('colegio', 'tracking', true, false, false, false),
  ('colegio', 'optimizar_ruta', false, false, false, false),
  ('colegio', 'planes', true, false, false, false),
  ('colegio', 'configuracion', true, false, true, false),
  ('padre', 'dashboard', true, false, false, false),
  ('padre', 'tracking', true, false, false, false),
  ('padre', 'configuracion', true, false, true, false);

