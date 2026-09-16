package com.odontologia.odontologia.Dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Agenda de un día: si el médico labora, turnos generados y su estado.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgendaDiaDto {
    private LocalDate fecha;
    private String diaSemana;
    private boolean laborable;
    private List<SlotAgendaDto> turnos;
}
