package com.odontologia.odontologia.Dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OdontologoDto {
    private Long id;
    private String nombre;
    private String apellido;
    private String matricula;
    private RolDto rol;
    private List<CitaDto> citas; // mostrar citas del odontólogo
}
