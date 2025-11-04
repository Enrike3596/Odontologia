package com.odontologia.odontologia.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.Cita2;

@Repository
public interface Cita2Repository extends JpaRepository<Cita2, Long>{
    // Puedes agregar métodos personalizados de consulta aquí si es necesario
}
