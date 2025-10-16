package com.odontologia.odontologia.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.Paciente;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    // Aquí puedes definir métodos personalizados si es necesario
}
