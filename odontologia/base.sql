-- ============================================
-- 🏥 BASE DE DATOS ODONTOLOGÍA
-- ============================================

-- Crear base de datos (ejecutar solo una vez)
CREATE DATABASE odontologia;

-- Conectarse a la base de datos
\c odontologia;
-- ============================================
CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE -- Ej: 'Recepcionista', 'Odontólogo'
);
-- ============================================
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasena VARCHAR(200) NOT NULL, -- encriptada (bcrypt o similar)
    id_rol INT NOT NULL REFERENCES rol(id_rol),
    activo BOOLEAN DEFAULT TRUE
);


-- ============================================
-- 🧱 TABLA: pacientes
-- ============================================
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  documento VARCHAR(50) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(100)
);

-- -- ============================================
-- CREATE TABLE paciente (
--     id_paciente SERIAL PRIMARY KEY,
--     tipo_documento VARCHAR(10) NOT NULL,
--     numero_documento VARCHAR(20) UNIQUE NOT NULL,
--     nombres VARCHAR(100) NOT NULL,
--     apellidos VARCHAR(100) NOT NULL,
--     telefono VARCHAR(20),
--     correo VARCHAR(100),
--     direccion VARCHAR(200),
--     fecha_nacimiento DATE,
--     genero VARCHAR(10),
--     fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================
CREATE TABLE odontologo (
    id_odontologo SERIAL PRIMARY KEY,
    numero_licencia VARCHAR(50) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    estado BOOLEAN DEFAULT TRUE
);

-- ============================================
CREATE TABLE tipo_cita (
    id_tipo_cita SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_estimada INT -- minutos
);


-- ============================================
-- 🧱 TABLA: citas
-- ============================================
CREATE TABLE citas (
  id SERIAL PRIMARY KEY,
  paciente_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  odontologo VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmada','cancelada')),
  CONSTRAINT fk_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);
-- -- ============================================
-- CREATE TABLE cita (
--     id_cita SERIAL PRIMARY KEY,
--     id_paciente INT NOT NULL REFERENCES paciente(id_paciente),
--     id_odontologo INT NOT NULL REFERENCES odontologo(id_odontologo),
--     id_tipo_cita INT NOT NULL REFERENCES tipo_cita(id_tipo_cita),
--     fecha_cita DATE NOT NULL,
--     hora_inicio TIME NOT NULL,
--     hora_fin TIME,
--     estado VARCHAR(20) DEFAULT 'Pendiente', -- Pendiente, Confirmada, Atendida, Cancelada
--     observaciones TEXT,
--     creada_por INT REFERENCES usuario(id_usuario), -- recepcionista que registró
--     fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================
CREATE TABLE historia_clinica (
    id_historia SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL REFERENCES paciente(id_paciente),
    id_cita INT REFERENCES cita(id_cita),
    diagnostico TEXT,
    tratamiento TEXT,
    receta TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ============================================
-- 👩‍⚕️ INSERTAR DATOS DE PACIENTES
-- ============================================
INSERT INTO pacientes (nombre, documento, telefono, correo) VALUES
('Carlos Ramírez', '1012345678', '3104567890', 'carlos.ramirez@example.com'),
('María Gómez', '1023456789', '3205678901', 'maria.gomez@example.com'),
('Andrés López', '1034567890', '3006789012', 'andres.lopez@example.com'),
('Paula Torres', '1045678901', '3117890123', 'paula.torres@example.com'),
('Luis Rodríguez', '1056789012', '3158901234', 'luis.rodriguez@example.com');

-- ============================================
-- 📅 INSERTAR DATOS DE CITAS
-- ============================================
INSERT INTO citas (paciente_id, fecha, hora, odontologo, estado) VALUES
(1, '2025-10-15', '09:00', 'Dra. Sandra Pérez', 'PENDIENTE'),
(2, '2025-10-16', '10:30', 'Dr. Juan Herrera', 'CONFIRMADA'),
(3, '2025-10-17', '14:00', 'Dra. Carolina Díaz', 'PENDIENTE'),
(4, '2025-10-18', '08:45', 'Dr. Pedro Gómez', 'CANCELADA'),
(5, '2025-10-19', '11:15', 'Dra. Ana Torres', 'CONFIRMADA');

-- ============================================
-- ✅ CONSULTAS DE PRUEBA
-- ============================================

-- Ver pacientes
SELECT * FROM pacientes;

-- Ver citas con nombre del paciente
SELECT c.id, p.nombre AS paciente, c.fecha, c.hora, c.odontologo, c.estado
FROM citas c
JOIN pacientes p ON c.paciente_id = p.id;
