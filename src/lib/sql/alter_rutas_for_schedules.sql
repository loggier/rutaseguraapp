-- Alterar la tabla de rutas para eliminar la columna de turno y agregar horarios de mañana y tarde.

-- Eliminar la columna 'turno' si existe.
ALTER TABLE rutasegura.rutas DROP COLUMN IF EXISTS turno;

-- Agregar la columna 'hora_salida_manana' si no existe.
ALTER TABLE rutasegura.rutas ADD COLUMN IF NOT EXISTS hora_salida_manana TIME WITHOUT TIME ZONE;

-- Agregar la columna 'hora_salida_tarde' si no existe.
ALTER TABLE rutasegura.rutas ADD COLUMN IF NOT EXISTS hora_salida_tarde TIME WITHOUT TIME ZONE;

-- También nos aseguramos de que la vieja columna 'hora_salida' se elimine si todavía existe de una versión anterior.
ALTER TABLE rutasegura.rutas DROP COLUMN IF EXISTS hora_salida;
