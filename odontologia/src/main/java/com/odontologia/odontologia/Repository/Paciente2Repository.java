package com.odontologia.odontologia.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.Paciente2;

@Repository
public interface Paciente2Repository extends JpaRepository<Paciente2, Long> {
    // Puedes agregar métodos personalizados de consulta aquí si es necesario
}
