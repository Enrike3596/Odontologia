package com.odontologia.odontologia.Dto;

import java.time.LocalDate;
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

    // Información personal
    private String tipoDocumento;
    private String documento;
    private LocalDate fechaNacimiento;
    private String genero;
    private String email;
    private String telefono;
    private String direccion;

    // Información profesional
    private String universidad;
    private Integer anoGraduacion;
    private Integer experiencia;
    private String especialidades;

    // Información de contacto de emergencia
    private String contactoEmergenciaNombre;
    private String contactoEmergenciaParentesco;
    private String contactoEmergenciaTelefono;

    // Horarios y disponibilidad
    private String diasTrabajo;
    private String horaInicio;
    private String horaFin;
    private String observaciones;

    private RolDto rol;
    private List<Cita2Dto> citas; // mostrar citas del odontólogo
}
