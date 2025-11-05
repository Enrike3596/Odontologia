package com.odontologia.odontologia.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDto {
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
    private String username;
    private String password;
    private Boolean activo;
    private RolDto rol;
}
