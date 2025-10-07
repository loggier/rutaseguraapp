-- Asegurarse de que el usuario master exista.
-- Asumimos que el ID del usuario master es 'a4e3b2b1-6b7a-4468-9844-472643365e69'
DO $$
DECLARE
    master_user_id UUID := 'a4e3b2b1-6b7a-4468-9844-472643365e69';
    colegio_sf_user_id UUID;
    colegio_ls_user_id UUID;
BEGIN
    -- Crear usuario para "Colegio San Francisco"
    INSERT INTO rutasegura.users (email, password, activo)
    VALUES ('colegio.sf@example.com', '$2a$12$x4.g6TzCgQy5R7f.L8C.r.FxrXzX..vQh.2Nq.hYPbYJzGj7g.c1G', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO colegio_sf_user_id;

    -- Si el usuario ya existía, obtener su ID
    IF colegio_sf_user_id IS NULL THEN
        SELECT id INTO colegio_sf_user_id FROM rutasegura.users WHERE email = 'colegio.sf@example.com';
    END IF;

    -- Crear perfil para "Colegio San Francisco"
    INSERT INTO rutasegura.profiles (id, nombre, apellido, rol)
    VALUES (colegio_sf_user_id, 'Colegio San', 'Francisco', 'colegio')
    ON CONFLICT (id) DO NOTHING;
    
    -- Crear entrada en la tabla colegios para "Colegio San Francisco"
    INSERT INTO rutasegura.colegios (id, nombre, ruc, email_contacto, telefono, direccion, codigo_postal, activo, creado_por)
    VALUES (colegio_sf_user_id, 'Colegio San Francisco', '1791234567001', 'contacto@sanfrancisco.edu.ec', '022555777', 'Av. 12 de Octubre, Quito', '170150', true, master_user_id)
    ON CONFLICT (id) DO NOTHING;


    -- Crear usuario para "Unidad Educativa La Sabiduría"
    INSERT INTO rutasegura.users (email, password, activo)
    VALUES ('colegio.ls@example.com', '$2a$12$2jH.E/nLZbYqD.C.5s9y7O3g4.Z.F/G.H.I.j.K.L.M.N.O.P.Q.R', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO colegio_ls_user_id;
    
    -- Si el usuario ya existía, obtener su ID
    IF colegio_ls_user_id IS NULL THEN
        SELECT id INTO colegio_ls_user_id FROM rutasegura.users WHERE email = 'colegio.ls@example.com';
    END IF;

    -- Crear perfil para "Unidad Educativa La Sabiduría"
    INSERT INTO rutasegura.profiles (id, nombre, apellido, rol)
    VALUES (colegio_ls_user_id, 'UE La', 'Sabiduría', 'colegio')
    ON CONFLICT (id) DO NOTHING;

    -- Crear entrada en la tabla colegios para "Unidad Educativa La Sabiduría"
    INSERT INTO rutasegura.colegios (id, nombre, ruc, email_contacto, telefono, direccion, codigo_postal, activo, creado_por)
    VALUES (colegio_ls_user_id, 'Unidad Educativa La Sabiduría', '0998765432001', 'info@lasabiduria.edu.ec', '042123456', 'Av. de las Américas, Guayaquil', '090101', false, master_user_id)
    ON CONFLICT (id) DO NOTHING;

END $$;
