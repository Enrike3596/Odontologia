package com.odontologia.odontologia.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "odontologos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Odontologo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String nombre;

    @Column(length = 100, nullable = false)
    private String apellido;

    @Column(length = 20, nullable = false, unique = true)
    private String matricula;

    // Información personal
    @Column(length = 10)
    private String tipoDocumento;

    @Column(length = 20, unique = true)
    private String documento;

    private LocalDate fechaNacimiento;

    @Column(length = 1)
    private String genero;

    @Column(length = 150, unique = true)
    private String email;

    @Column(length = 15)
    private String telefono;

    @Column(length = 255)
    private String direccion;

    // Información profesional
    @Column(length = 200)
    private String universidad;

    private Integer anoGraduacion;

    private Integer experiencia;

    @Column(columnDefinition = "TEXT")
    private String especialidades;

    // Información de contacto de emergencia
    @Column(length = 100)
    private String contactoEmergenciaNombre;

    @Column(length = 50)
    private String contactoEmergenciaParentesco;

    @Column(length = 15)
    private String contactoEmergenciaTelefono;

    // Horarios y disponibilidad
    @Column(columnDefinition = "TEXT")
    private String diasTrabajo;

    @Column(length = 5)
    private String horaInicio;

    @Column(length = 5)
    private String horaFin;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @OneToMany(mappedBy = "odontologo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Cita2> citas;
}
