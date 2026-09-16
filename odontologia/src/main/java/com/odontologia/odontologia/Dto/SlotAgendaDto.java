package com.odontologia.odontologia.Dto;

import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Un turno dentro del día de la agenda.
 * estado: LIBRE, OCUPADO, BLOQUEADO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlotAgendaDto {
    private LocalTime hora;
    private String estado;
    private Long citaId;
}
