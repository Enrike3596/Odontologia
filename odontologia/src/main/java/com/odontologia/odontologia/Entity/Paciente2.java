package com.odontologia.odontologia.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "pacientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Paciente2 {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String nombres;

    @Column(length = 100, nullable = false)
    private String apellidos;

    @Column(length = 10, nullable = false)
    private String tipoDocumento;

    @Column(length = 20, nullable = false, unique = true)
    private String documento;

    @Column(nullable = false)
    private LocalDate fechaNacimiento;

    @Column(length = 1, nullable = false)
    private String genero;

    @Column(length = 150, unique = true)
    private String email;

    @Column(length = 15, nullable = false)
    private String telefono;

    @Column(length = 255)
    private String direccion;

    @Column(length = 100)
    private String contactoEmergenciaNombre;

    @Column(length = 50)
    private String contactoEmergenciaParentesco;

    @Column(length = 15)
    private String contactoEmergenciaTelefono;

    @Column(columnDefinition = "TEXT")
    private String alergias;

    @Column(columnDefinition = "TEXT")
    private String medicamentos;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @OneToMany(mappedBy = "paciente", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Cita2> citas;

    @OneToOne(mappedBy = "paciente", cascade = CascadeType.ALL, orphanRemoval = true)
    private HistoriaClinica historiaClinica;
}
