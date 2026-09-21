package com.odontologia.odontologia.Dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.odontologia.odontologia.Enums.TipoMovimientoAgenda;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloqueoAgendaDto {
    private Long id;
    private Long odontologoId;
    private String odontologoNombre;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private TipoMovimientoAgenda tipo;
    private String motivo;
    private Boolean activo;
}
