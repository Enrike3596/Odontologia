package com.odontologia.odontologia.Dto;

import com.odontologia.odontologia.Enums.EstadoCitaEnum;
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
    /** Indica si ya se envió el recordatorio por correo (solo informativo para la UI). */
    private Boolean recordatorioEnviado;
    /** Opt-in del formulario: enviar correos de confirmación/recordatorio. */
    private Boolean enviarRecordatorio;
    /** Email del usuario que agenda (desde la sesión) para la copia informativa. */
    private String emailSolicitante;
}
