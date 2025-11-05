-- Datos iniciales para roles
INSERT INTO roles (id, nombre) VALUES (1, 'administrador') ON CONFLICT (id) DO NOTHING;
INSERT INTO roles (id, nombre) VALUES (2, 'odontologo') ON CONFLICT (id) DO NOTHING;
INSERT INTO roles (id, nombre) VALUES (3, 'recepcionista') ON CONFLICT (id) DO NOTHING;

-- Usuario administrador por defecto
INSERT INTO usuarios (id, nombres, apellidos, tipo_documento, documento, fecha_nacimiento, genero, email, telefono, direccion, username, password, activo, rol_id) 
VALUES (1, 'Administrador', 'Sistema', 'CC', '12345678', '1990-01-01', 'M', 'admin@clinica.com', '3001234567', 'Clínica Odontológica', 'admin', 'admin123', true, 1)
ON CONFLICT (id) DO NOTHING;