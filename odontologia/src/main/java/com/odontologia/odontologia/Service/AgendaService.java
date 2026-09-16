package com.odontologia.odontologia.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.odontologia.odontologia.Dto.AgendaDiaDto;
import com.odontologia.odontologia.Dto.BloqueoAgendaDto;

public interface AgendaService {

    /** Agenda completa del mes (1-12) para un odontólogo. */
    List<AgendaDiaDto> agendaMensual(Long odontologoId, int anio, int mes);

    /** Agenda de un día puntual. */
    AgendaDiaDto agendaDia(Long odontologoId, LocalDate fecha);

    /** ¿El turno está abierto y libre? Lanza RuntimeException si no. */
    void validarTurnoDisponible(Long odontologoId, LocalDate fecha, LocalTime hora);

    /** ¿El turno está abierto y libre? Versión booleana (excluye una cita al editar). */
    boolean turnoDisponible(Long odontologoId, LocalDate fecha, LocalTime hora, Long excluirCitaId);

    List<BloqueoAgendaDto> listarMovimientos(Long odontologoId, LocalDate desde, LocalDate hasta);

    BloqueoAgendaDto crearMovimiento(BloqueoAgendaDto dto);

    void eliminarMovimiento(Long id);
}
