package com.odontologia.odontologia.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CitaDto {
    private Long id;
    private Long pacienteId;
    private String pacienteNombre;
    private String pacienteDocumento;
    private String pacienteTelefono;
    private String pacienteCorreo;
    private String fecha; // Formato "yyyy-MM-dd"
    private String hora;  // Formato "HH:mm"
    private String odontologo;
    private String estado; // "PENDIENTE", "CONFIRMADA", "CANCELADA"
}
