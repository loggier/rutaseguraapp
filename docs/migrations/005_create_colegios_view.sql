-- Elimina la vista si existe para asegurar que se apliquen los cambios.
DROP VIEW IF EXISTS rutasegura.colegios_view;

-- Crea la vista uniendo 'colegios' y 'users' para incluir el email del usuario.
-- El JOIN se hace sobre colegios.usuario_id = users.id para obtener el email de la cuenta.
CREATE VIEW rutasegura.colegios_view AS
SELECT
  c.id,
  c.nombre,
  c.ruc,
  c.email_contacto,
  c.telefono,
  c.direccion,
  c.codigo_postal,
  c.activo,
  c.usuario_id,
  c.creado_por,
  u.email
FROM
  rutasegura.colegios c
  JOIN rutasegura.users u ON c.usuario_id = u.id;
