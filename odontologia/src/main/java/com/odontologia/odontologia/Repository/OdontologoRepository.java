package com.odontologia.odontologia.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.Odontologo;

@Repository
public interface OdontologoRepository extends JpaRepository<Odontologo, Long> {
    // Odontólogos cuya cadena de especialidades contiene el texto (para filtrar por especialidad/tipo de cita)
    java.util.List<Odontologo> findByEspecialidadesContainingIgnoreCase(String especialidad);
}
