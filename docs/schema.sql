-- Aseguramos que el schema existe
CREATE SCHEMA IF NOT EXISTS rutasegura;

-- Habilitamos la extensión pgcrypto si no está habilitada.
-- Es necesaria para la función crypt() para hashear contraseñas.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Borramos cualquier tabla o tipo existente para empezar de cero (¡cuidado en producción!)
DROP TABLE IF EXISTS rutasegura.permissions CASCADE;
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

-- 2. Creamos la tabla de usuarios (users) que reemplaza a profiles y auth.users.
CREATE TABLE rutasegura.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Almacenará el hash de la contraseña
  nombre TEXT,
  apellido TEXT,
  rol rutasegura.user_role NOT NULL DEFAULT 'padre',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
COMMENT ON TABLE rutasegura.users IS 'Tabla principal para almacenar todos los usuarios de la aplicación.';
COMMENT ON COLUMN rutasegura.users.password IS 'Hash de la contraseña del usuario. Usar crypt() con gen_salt(''bf'').';


-- 3. Creamos un tipo ENUM para los módulos de la aplicación.
CREATE TYPE rutasegura.module AS ENUM (
  'dashboard',
  'estudiantes',
  'conductores',
  'autobuses',
  'rutas',
  'seguimiento',
  'optimizar_ruta',
  'planes',
  'configuracion'
);

-- 4. Creamos la tabla de permisos (permissions).
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

-- Por ahora, mantendremos RLS deshabilitado para simplificar mientras construimos la lógica de auth.
-- La seguridad se manejará a nivel de API.
-- Habilitaremos RLS más adelante con políticas basadas en JWT personalizado si es necesario.
ALTER TABLE rutasegura.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE rutasegura.permissions DISABLE ROW LEVEL SECURITY;

-- Concedemos permisos a los roles de Supabase para que puedan interactuar con el schema y las tablas.
GRANT USAGE ON SCHEMA rutasegura TO anon, authenticated, service_role;
GRANT ALL ON TABLE rutasegura.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE rutasegura.permissions TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rutasegura TO anon, authenticated, service_role;

-- ****************
-- 3. FUNCIONES, TRIGGERS E INSERCIONES
-- ****************

-- Función para manejar el 'updated_at'
CREATE OR REPLACE FUNCTION rutasegura.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para la tabla de usuarios
CREATE TRIGGER on_user_update
  BEFORE UPDATE ON rutasegura.users
  FOR EACH ROW
  EXECUTE PROCEDURE rutasegura.handle_updated_at();

-- Insertamos los permisos por rol
INSERT INTO rutasegura.permissions (rol, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
  ('master', 'dashboard', true, true, true, true),
  ('master', 'estudiantes', true, true, true, true),
  ('master', 'conductores', true, true, true, true),
  ('master', 'autobuses', true, true, true, true),
  ('master', 'rutas', true, true, true, true),
  ('master', 'seguimiento', true, true, true, true),
  ('master', 'optimizar_ruta', true, true, true, true),
  ('master', 'planes', true, true, true, true),
  ('master', 'configuracion', true, true, true, true),
  ('manager', 'dashboard', true, false, false, false),
  ('manager', 'estudiantes', true, true, true, true),
  ('manager', 'conductores', true, true, true, true),
  ('manager', 'autobuses', true, true, true, true),
  ('manager', 'rutas', true, true, true, true),
  ('manager', 'seguimiento', true, false, false, false),
  ('manager', 'optimizar_ruta', true, false, false, false),
  ('manager', 'planes', false, false, false, false),
  ('manager', 'configuracion', true, false, true, false),
  ('colegio', 'dashboard', true, false, false, false),
  ('colegio', 'estudiantes', true, true, true, false),
  ('colegio', 'conductores', true, false, false, false),
  ('colegio', 'autobuses', true, false, false, false),
  ('colegio', 'rutas', true, false, false, false),
  ('colegio', 'seguimiento', true, false, false, false),
  ('colegio', 'optimizar_ruta', false, false, false, false),
  ('colegio', 'planes', true, false, false, false),
  ('colegio', 'configuracion', true, false, true, false),
  ('padre', 'dashboard', true, false, false, false),
  ('padre', 'seguimiento', true, false, false, false),
  ('padre', 'configuracion', true, false, true, false);

-- ****************
-- 4. INSERCIÓN DE USUARIO MASTER
-- ****************

-- Insertamos el usuario master con la contraseña hasheada.
-- La contraseña es 'Martes13'
INSERT INTO rutasegura.users (email, password, nombre, apellido, rol)
VALUES (
  'master@rutasegura.com',
  crypt('Martes13', gen_salt('bf')),
  'Usuario',
  'Maestro',
  'master'
);

-- NOTA: Para verificar la contraseña en una consulta de login, usarías:
-- SELECT * FROM rutasegura.users WHERE email = 'master@rutasegura.com' AND password = crypt('CONTRASEÑA_PROPORCIONADA', password);

