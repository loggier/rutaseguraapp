-- Agrega las columnas 'calle' y 'numero' a la tabla de paradas
ALTER TABLE rutasegura.paradas
ADD COLUMN calle VARCHAR(255),
ADD COLUMN numero VARCHAR(50);

-- Comentario para explicar el propósito de las nuevas columnas
COMMENT ON COLUMN rutasegura.paradas.calle IS 'Almacena el nombre de la calle, extraído de la dirección autocompletada o ingresado manualmente.';
COMMENT ON COLUMN rutasegura.paradas.numero IS 'Almacena el número de la dirección, extraído o ingresado manualmente para mayor precisión.';
