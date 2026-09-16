package com.odontologia.odontologia.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.Paciente2;

@Repository
public interface Paciente2Repository extends JpaRepository<Paciente2, Long> {
    // Búsqueda por cédula/documento para el módulo de agendar citas
    java.util.Optional<Paciente2> findByDocumento(String documento);
}
