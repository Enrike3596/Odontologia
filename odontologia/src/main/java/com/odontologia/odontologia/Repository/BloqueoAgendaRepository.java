package com.odontologia.odontologia.Repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.BloqueoAgenda;
import com.odontologia.odontologia.Enums.TipoMovimientoAgenda;

@Repository
public interface BloqueoAgendaRepository extends JpaRepository<BloqueoAgenda, Long> {

    List<BloqueoAgenda> findByOdontologoIdAndActivoTrue(Long odontologoId);

    List<BloqueoAgenda> findByOdontologoIdAndFechaAndActivoTrue(Long odontologoId, LocalDate fecha);

    List<BloqueoAgenda> findByOdontologoIdAndFechaBetweenAndActivoTrue(Long odontologoId, LocalDate desde, LocalDate hasta);

    List<BloqueoAgenda> findByOdontologoIdAndFechaBetweenAndTipoAndActivoTrue(
            Long odontologoId, LocalDate desde, LocalDate hasta, TipoMovimientoAgenda tipo);
}
