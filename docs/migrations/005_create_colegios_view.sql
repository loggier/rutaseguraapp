-- docs/migrations/005_create_colegios_view.sql

-- Esta vista resuelve la ambigüedad de la relación entre 'colegios' y 'users'.
-- Selecciona todas las columnas de 'colegios' y añade el 'email' de la tabla 'users'
-- uniendo explícitamente por el ID de la cuenta del colegio.

CREATE OR REPLACE VIEW rutasegura.colegios_view AS
SELECT
    c.id,
    c.nombre,
    c.ruc,
    c.email_contacto,
    c.telefono,
    c.direccion,
    c.codigo_postal,
    c.activo,
    c.creado_por,
    u.email
FROM
    rutasegura.colegios c
JOIN
    rutasegura.users u ON c.id = u.id;

-- Con esta vista, el frontend puede hacer una consulta simple como:
-- SELECT * FROM rutasegura.colegios_view;
-- Y obtener todos los datos necesarios sin ambigüedad.
