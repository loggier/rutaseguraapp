-- Aseguramos que el schema existe
CREATE SCHEMA IF NOT EXISTS rutasegura;

-- Habilitamos la extensión pgcrypto si no existe (para gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

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

-- 2. Creamos la tabla de usuarios para credenciales
CREATE TABLE rutasegura.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Almacenará el hash de la contraseña
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Creamos la tabla de perfiles (profiles).
CREATE TABLE rutasegura.profiles (
  id UUID PRIMARY KEY REFERENCES rutasegura.users(id) ON DELETE CASCADE,
  nombre TEXT,
  apellido TEXT,
  rol rutasegura.user_role NOT NULL DEFAULT 'padre',
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
-- 2. PRIVILEGIOS
-- ****************

-- Conceder USO del schema a los roles.
GRANT USAGE ON SCHEMA rutasegura TO anon, authenticated, service_role;
-- Conceder todos los privilegios en las tablas al rol de servicio para operaciones de backend.
GRANT ALL ON TABLE rutasegura.users TO service_role;
GRANT ALL ON TABLE rutasegura.profiles TO service_role;
GRANT ALL ON TABLE rutasegura.permissions TO service_role;
-- Permitir que los usuarios autenticados (una vez que tengamos sesión) puedan leer sus propios datos.
GRANT SELECT ON TABLE rutasegura.users TO authenticated;
GRANT SELECT, UPDATE ON TABLE rutasegura.profiles TO authenticated;
GRANT SELECT ON TABLE rutasegura.permissions TO authenticated, anon;


-- ****************
-- 3. FUNCIONES, TRIGGERS E INSERCIONES
-- ****************

-- Función para manejar el 'updated_at' en la tabla de perfiles
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

-- Insertamos los permisos iniciales
INSERT INTO rutasegura.permissions (rol, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
  ('master', 'dashboard', true, true, true, true),
  ('master', 'users', true, true, true, true),
  ('master', 'estudiantes', true, true, true, true),
  ('master', 'conductores', true, true, true, true),
  ('master', 'autobuses', true, true, true, true),
  ('master', 'rutas', true, true, true, true),
  ('master', 'tracking', true, true, true, true),
  ('master', 'optimize-route', true, true, true, true),
  ('master', 'plans', true, true, true, true),
  ('master', 'settings', true, true, true, true),
  ('manager', 'dashboard', true, false, false, false),
  ('manager', 'estudiantes', true, true, true, true),
  ('manager', 'conductores', true, true, true, true),
  ('manager', 'autobuses', true, true, true, true),
  ('manager', 'rutas', true, true, true, true),
  ('manager', 'tracking', true, false, false, false),
  ('manager', 'optimize-route', true, false, false, false),
  ('manager', 'plans', false, false, false, false),
  ('manager', 'settings', true, false, true, false),
  ('colegio', 'dashboard', true, false, false, false),
  ('colegio', 'estudiantes', true, true, true, false),
  ('colegio', 'conductores', true, false, false, false),
  ('colegio', 'autobuses', true, false, false, false),
  ('colegio', 'rutas', true, false, false, false),
  ('colegio', 'tracking', true, false, false, false),
  ('colegio', 'optimize-route', false, false, false, false),
  ('colegio', 'plans', true, false, false, false),
  ('colegio', 'settings', true, false, true, false),
  ('padre', 'dashboard', true, false, false, false),
  ('padre', 'tracking', true, false, false, false),
  ('padre', 'settings', true, false, true, false);

-- Insertar el usuario maestro
WITH master_user AS (
  INSERT INTO rutasegura.users (email, password)
  VALUES ('master@rutasegura.com', '$2a$12$AsiX8q.KjNhY/6uBC154/O9aYhWn3wzY0OUa3qWym5iT12jdxgC5e') -- Hash para 'Martes13'
  RETURNING id
)
INSERT INTO rutasegura.profiles (id, nombre, apellido, rol)
SELECT id, 'Usuario', 'Maestro', 'master' FROM master_user;
