-- Aseguramos que el schema existe
CREATE SCHEMA IF NOT EXISTS rutasegura;

-- Habilitamos la extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Borramos cualquier tabla o tipo existente para empezar de cero (¡cuidado en producción!)
DROP TABLE IF EXISTS rutasegura.permissions CASCADE;
DROP TABLE IF EXISTS rutasegura.profiles CASCADE;
DROP TABLE IF EXISTS rutasegura.users CASCADE;
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

-- 2. Creamos la tabla de usuarios (users) para credenciales.
CREATE TABLE rutasegura.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3. Creamos la tabla de perfiles (profiles) para datos adicionales.
CREATE TABLE rutasegura.profiles (
  id UUID PRIMARY KEY REFERENCES rutasegura.users(id) ON DELETE CASCADE,
  nombre TEXT,
  apellido TEXT,
  avatar_url TEXT,
  rol rutasegura.user_role NOT NULL DEFAULT 'padre',
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

-- Concedemos USO del schema a los roles de Supabase.
GRANT USAGE ON SCHEMA rutasegura TO anon, authenticated, service_role;

-- Concedemos permisos básicos a las tablas para los roles de Supabase.
-- La seguridad se manejará principalmente en la API por ahora.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rutasegura.users TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rutasegura.profiles TO anon, authenticated, service_role;
GRANT SELECT ON TABLE rutasegura.permissions TO anon, authenticated, service_role;

-- Habilitamos RLS en las tablas, aunque las políticas serán permisivas por ahora.
ALTER TABLE rutasegura.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutasegura.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutasegura.permissions ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (permiten todo por ahora, se ajustarán con la lógica de sesión)
CREATE POLICY "Allow all on users" ON rutasegura.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on profiles" ON rutasegura.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissions are public" ON rutasegura.permissions FOR SELECT USING (true);


-- ****************
-- 3. FUNCIONES, TRIGGERS E INSERCIONES
-- ****************

-- Función para manejar el 'updated_at' en la tabla users
CREATE OR REPLACE FUNCTION rutasegura.handle_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_update
  BEFORE UPDATE ON rutasegura.users
  FOR EACH ROW
  EXECUTE PROCEDURE rutasegura.handle_user_updated_at();

-- Función para manejar el 'updated_at' en la tabla profiles
CREATE OR REPLACE FUNCTION rutasegura.handle_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON rutasegura.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE rutasegura.handle_profile_updated_at();
  
-- Función para crear un perfil cuando se crea un usuario nuevo
CREATE OR REPLACE FUNCTION rutasegura.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rutasegura.profiles (id, nombre, apellido, rol)
  VALUES (NEW.id, 'Nuevo', 'Usuario', 'padre'); -- Valores por defecto
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON rutasegura.users
  FOR EACH ROW EXECUTE PROCEDURE rutasegura.handle_new_user();


-- Insertamos los permisos por rol y módulo
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
  ('colegio', 'seguimiento', true, false, false, false),
  ('colegio', 'optimize-route', false, false, false, false),
  ('colegio', 'plans', true, false, false, false),
  ('colegio', 'settings', true, false, true, false),
  ('padre', 'dashboard', true, false, false, false),
  ('padre', 'tracking', true, false, false, false),
  ('padre', 'settings', true, false, true, false);

-- Creamos el usuario master
WITH master_user AS (
  INSERT INTO rutasegura.users (email, password)
  VALUES ('master@rutasegura.com', crypt('Martes13', gen_salt('bf')))
  RETURNING id
)
UPDATE rutasegura.profiles
SET
  nombre = 'Usuario',
  apellido = 'Maestro',
  rol = 'master'
WHERE id = (SELECT id FROM master_user);

