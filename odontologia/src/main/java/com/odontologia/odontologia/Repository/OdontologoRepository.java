package com.odontologia.odontologia.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.Odontologo;

@Repository
public interface OdontologoRepository extends JpaRepository<Odontologo, Long> {
    // Puedes agregar métodos personalizados de consulta aquí si es necesario
}
