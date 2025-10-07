-- Aseguramos que el schema existe
CREATE SCHEMA IF NOT EXISTS rutasegura;

-- Borramos cualquier tabla o tipo existente para empezar de cero (¡cuidado en producción!)
DROP TABLE IF EXISTS rutasegura.permissions CASCADE;
DROP TABLE IF EXISTS rutasegura.profiles CASCADE;
DROP TABLE IF EXISTS rutasegura.users CASCADE;
DROP TYPE IF EXISTS rutasegura.user_role CASCADE;
DROP TYPE IF EXISTS rutasegura.module CASCADE;

-- Habilitamos la extensión para encriptar contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- 2. Creamos la tabla de usuarios para credenciales.
CREATE TABLE rutasegura.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3. Creamos la tabla de perfiles (profiles) que referencia a users.
CREATE TABLE rutasegura.profiles (
  id UUID PRIMARY KEY REFERENCES rutasegura.users(id) ON DELETE CASCADE,
  nombre TEXT,
  apellido TEXT,
  rol rutasegura.user_role NOT NULL DEFAULT 'padre',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 4. Creamos un tipo ENUM para los módulos de la aplicación.
CREATE TYPE rutasegura.module AS ENUM (
  'dashboard',
  'users',
  'students',
  'drivers',
  'buses',
  'routes',
  'tracking',
  'optimize-route',
  'plans',
  'settings'
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

-- Concedemos uso del schema a los roles de Supabase (aunque no usemos su auth, es buena práctica)
GRANT USAGE ON SCHEMA rutasegura TO anon, authenticated, service_role;

-- Por ahora, no habilitaremos RLS para simplificar la migración.
-- La seguridad se manejará en la capa de API.
-- ALTER TABLE rutasegura.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rutasegura.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rutasegura.permissions ENABLE ROW LEVEL SECURITY;

-- Concedemos permisos directos a las tablas para el rol 'authenticated'
-- que usaremos con nuestro cliente de Supabase.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rutasegura.users TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rutasegura.profiles TO authenticated, service_role;
GRANT SELECT ON TABLE rutasegura.permissions TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE rutasegura.permissions_id_seq TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA rutasegura
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA rutasegura
    GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;

-- ****************
-- 3. FUNCIONES Y TRIGGERS
-- ****************

-- Función para manejar el 'updated_at' en la tabla USERS
CREATE OR REPLACE FUNCTION rutasegura.handle_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_users_update
  BEFORE UPDATE ON rutasegura.users
  FOR EACH ROW
  EXECUTE PROCEDURE rutasegura.handle_users_updated_at();

-- Función para manejar el 'updated_at' en la tabla PROFILES
CREATE OR REPLACE FUNCTION rutasegura.handle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_update
  BEFORE UPDATE ON rutasegura.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE rutasegura.handle_profiles_updated_at();


-- ****************
-- 4. INSERCIONES INICIALES
-- ****************

-- Insertamos los permisos por rol y módulo.
INSERT INTO rutasegura.permissions (rol, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
  ('master', 'dashboard', true, true, true, true),
  ('master', 'users', true, true, true, true),
  ('master', 'students', true, true, true, true),
  ('master', 'drivers', true, true, true, true),
  ('master', 'buses', true, true, true, true),
  ('master', 'routes', true, true, true, true),
  ('master', 'tracking', true, true, true, true),
  ('master', 'optimize-route', true, true, true, true),
  ('master', 'plans', true, true, true, true),
  ('master', 'settings', true, true, true, true),
  ('manager', 'dashboard', true, false, false, false),
  ('manager', 'students', true, true, true, true),
  ('manager', 'drivers', true, true, true, true),
  ('manager', 'buses', true, true, true, true),
  ('manager', 'routes', true, true, true, true),
  ('manager', 'tracking', true, false, false, false),
  ('manager', 'optimize-route', true, false, false, false),
  ('manager', 'plans', false, false, false, false),
  ('manager', 'settings', true, false, true, false),
  ('colegio', 'dashboard', true, false, false, false),
  ('colegio', 'students', true, true, true, false),
  ('colegio', 'drivers', true, false, false, false),
  ('colegio', 'buses', true, false, false, false),
  ('colegio', 'routes', true, false, false, false),
  ('colegio', 'tracking', true, false, false, false),
  ('colegio', 'optimize-route', false, false, false, false),
  ('colegio', 'plans', true, false, false, false),
  ('colegio', 'settings', true, false, true, false),
  ('padre', 'dashboard', true, false, false, false),
  ('padre', 'tracking', true, false, false, false),
  ('padre', 'settings', true, false, true, false);

-- Insertamos el usuario master
WITH master_user AS (
  INSERT INTO rutasegura.users (email, password)
  VALUES ('master@rutasegura.com', crypt('Martes13', gen_salt('bf')))
  RETURNING id
)
INSERT INTO rutasegura.profiles (id, nombre, apellido, rol)
SELECT id, 'Master', 'Admin', 'master' FROM master_user;
