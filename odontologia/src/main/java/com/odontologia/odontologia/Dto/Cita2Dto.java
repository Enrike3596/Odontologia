package com.odontologia.odontologia.Dto;

import com.odontologia.odontologia.Entity.EstadoCitaEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cita2Dto {
    private Long id;
    private LocalDate fecha;
    private LocalTime hora;
    private Paciente2Dto paciente;
    private OdontologoDto odontologo;
    private TipoCitaDto tipoCita;
    private EstadoCitaEnum estado;
    private String observaciones;
}
