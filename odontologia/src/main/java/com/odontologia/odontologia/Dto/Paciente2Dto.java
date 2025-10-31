package com.odontologia.odontologia.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Paciente2Dto {
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private RolDto rol;
}
