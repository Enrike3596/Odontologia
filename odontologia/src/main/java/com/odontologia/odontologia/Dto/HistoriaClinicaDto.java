package com.odontologia.odontologia.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoriaClinicaDto {
    private Long id;
    private String antecedentes;
    private String alergias;
    private String medicamentos;
    private String enfermedades;
    private String cirugias;
    private String observaciones;
    private Paciente2Dto paciente;
}
