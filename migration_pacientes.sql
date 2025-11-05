-- ============================================
-- MIGRACIÓN: Actualizar tabla pacientes
-- ============================================

-- Primero, eliminar la tabla existente si es necesario
-- (CUIDADO: esto borrará todos los datos existentes)
DROP TABLE IF EXISTS pacientes CASCADE;

-- Crear la nueva tabla con la estructura completa
CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(1) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefono VARCHAR(15) NOT NULL,
    direccion VARCHAR(255),
    contacto_emergencia_nombre VARCHAR(100),
    contacto_emergencia_parentesco VARCHAR(50),
    contacto_emergencia_telefono VARCHAR(15),
    alergias TEXT,
    medicamentos TEXT,
    observaciones TEXT
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_pacientes_documento ON pacientes(documento);
CREATE INDEX idx_pacientes_email ON pacientes(email);
CREATE INDEX idx_pacientes_nombres ON pacientes(nombres, apellidos);