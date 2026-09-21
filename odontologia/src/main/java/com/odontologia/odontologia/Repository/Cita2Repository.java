package com.odontologia.odontologia.Repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.Cita2;
import com.odontologia.odontologia.Enums.EstadoCitaEnum;

@Repository
public interface Cita2Repository extends JpaRepository<Cita2, Long> {

    /** Citas de un odontólogo en una fecha (para agenda y validación de solape). */
    List<Cita2> findByOdontologoIdAndFecha(Long odontologoId, LocalDate fecha);

    /** Citas de una fecha en ciertos estados (para recordatorios). */
    List<Cita2> findByFechaAndEstadoIn(LocalDate fecha, List<EstadoCitaEnum> estados);

    /** Citas en ciertos estados (para el barrido automático de vencidas). */
    List<Cita2> findByEstadoIn(List<EstadoCitaEnum> estados);
}
