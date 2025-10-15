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
public class PacienteDto {
    private Long id;
    private String nombre;
    private String documento;
    private String telefono;
    private String correo;
}
