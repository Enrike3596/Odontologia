package com.odontologia.odontologia.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Paciente2Dto {
    private Long id;
    private String nombres;
    private String apellidos;
    private String tipoDocumento;
    private String documento;
    private LocalDate fechaNacimiento;
    private String genero;
    private String email;
    private String telefono;
    private String direccion;
    private String contactoEmergenciaNombre;
    private String contactoEmergenciaParentesco;
    private String contactoEmergenciaTelefono;
    private String alergias;
    private String medicamentos;
    private String observaciones;
}
