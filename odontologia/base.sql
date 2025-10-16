-- ============================================
-- 🏥 BASE DE DATOS ODONTOLOGÍA
-- ============================================

-- Crear base de datos (ejecutar solo una vez)
CREATE DATABASE odontologia;

-- Conectarse a la base de datos
\c odontologia;

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
