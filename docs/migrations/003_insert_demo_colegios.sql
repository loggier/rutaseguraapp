-- docs/migrations/003_insert_demo_colegios.sql

-- NOTA: Este script asume que ya existe un usuario (master/manager) con el ID 'a4e3b2b1-6b7a-4468-9844-472643365e69' que actuará como 'creado_por'.
-- Si tu ID de usuario master es diferente, por favor, ajústalo en los inserts de la tabla 'colegios'.

-- --- COLEGIO 1: San Francisco ---
-- 1. Crear el usuario para el Colegio San Francisco
INSERT INTO rutasegura.users (id, email, password, activo)
VALUES ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'colegio.sf@example.com', '$2a$12$L7R9F5/yV6.zC2.p/bJgS.s2qD3wE4.a5R6f7g8H9i0J1k2L3m4N', true); -- La contraseña es 'password123'

-- 2. Crear el perfil para el Colegio San Francisco
INSERT INTO rutasegura.profiles (id, nombre, apellido, rol)
VALUES ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Colegio San Francisco', '(Institución)', 'colegio');

-- 3. Crear la entrada en la tabla de colegios
INSERT INTO rutasegura.colegios (id, nombre, ruc, email_contacto, telefono, direccion, codigo_postal, activo, creado_por)
VALUES (
  'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
  'Colegio San Francisco', 
  '1791234567001', 
  'contacto@sanfrancisco.edu.ec', 
  '022555777', 
  'Av. 12 de Octubre, Quito', 
  '170150', 
  true, 
  'a4e3b2b1-6b7a-4468-9844-472643365e69' -- ID del usuario master/manager
);


-- --- COLEGIO 2: Unidad Educativa La Sabiduría ---
-- 1. Crear el usuario para La Sabiduría
INSERT INTO rutasegura.users (id, email, password, activo)
VALUES ('b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'colegio.ls@example.com', '$2a$12$K8L9G0/zV7.yC3.q/cJgT.t3rD4wE5.b6R7f8g9H0i1J2k3L4m5O', true); -- La contraseña es 'password123'

-- 2. Crear el perfil para La Sabiduría
INSERT INTO rutasegura.profiles (id, nombre, apellido, rol)
VALUES ('b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'Unidad Educativa La Sabiduría', '(Institución)', 'colegio');

-- 3. Crear la entrada en la tabla de colegios
INSERT INTO rutasegura.colegios (id, nombre, ruc, email_contacto, telefono, direccion, codigo_postal, activo, creado_por)
VALUES (
  'b2c3d4e5-f6a7-8901-2345-67890abcdef1', 
  'Unidad Educativa La Sabiduría', 
  '0998765432001', 
  'info@lasabiduria.edu.ec', 
  '042123456', 
  'Av. de las Américas, Guayaquil', 
  '090101', 
  false, -- Este colegio se creará como inactivo
  'a4e3b2b1-6b7a-4468-9844-472643365e69' -- ID del usuario master/manager
);
