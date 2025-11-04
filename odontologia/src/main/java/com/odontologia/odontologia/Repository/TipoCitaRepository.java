package com.odontologia.odontologia.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.TipoCita;

@Repository
public interface TipoCitaRepository extends JpaRepository<TipoCita, Long>{
    // Puedes agregar métodos personalizados de consulta aquí si es necesario
}
