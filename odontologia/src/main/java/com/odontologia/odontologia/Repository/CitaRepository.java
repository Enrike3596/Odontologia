package com.odontologia.odontologia.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.Cita;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    // Aquí puedes definir métodos personalizados si es necesario
}
