-- Add new columns to the colegios table
ALTER TABLE rutasegura.colegios
ADD COLUMN lat double precision,
ADD COLUMN lng double precision,
ADD COLUMN calle character varying,
ADD COLUMN numero character varying;

-- Recreate or replace the colegios_view to include the new columns
DROP VIEW IF EXISTS rutasegura.colegios_view;

CREATE OR REPLACE VIEW rutasegura.colegios_view AS
SELECT
    c.id,
    c.usuario_id,
    c.nombre,
    c.ruc,
    c.email_contacto,
    c.telefono,
    c.direccion,
    c.lat,
    c.lng,
    c.calle,
    c.numero,
    c.activo,
    c.creado_por,
    u.email
FROM
    rutasegura.colegios c
JOIN
    rutasegura.users u ON c.usuario_id = u.id;

-- Ensure the view is owned by the supabase_admin role
ALTER VIEW rutasegura.colegios_view OWNER TO supabase_admin;
-- Grant usage on the schema and select on the view to the authenticated role
GRANT USAGE ON SCHEMA rutasegura TO authenticated;
GRANT SELECT ON rutasegura.colegios_view TO authenticated;
GRANT USAGE ON SCHEMA rutasegura TO service_role;
GRANT SELECT ON rutasegura.colegios_view TO service_role;
