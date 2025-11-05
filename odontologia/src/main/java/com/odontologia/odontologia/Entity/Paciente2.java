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

    @Column(name = "nombres", length = 100, nullable = false)
    private String nombres;

    @Column(name = "apellidos", length = 100, nullable = false)
    private String apellidos;

    @Column(name = "tipo_documento", length = 10, nullable = false)
    private String tipoDocumento;

    @Column(name = "documento", length = 20, nullable = false, unique = true)
    private String documento;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "genero", length = 1, nullable = false)
    private String genero;

    @Column(name = "email", length = 150, unique = true)
    private String email;

    @Column(name = "telefono", length = 15, nullable = false)
    private String telefono;

    @Column(name = "direccion", length = 255)
    private String direccion;

    @Column(name = "contacto_emergencia_nombre", length = 100)
    private String contactoEmergenciaNombre;

    @Column(name = "contacto_emergencia_parentesco", length = 50)
    private String contactoEmergenciaParentesco;

    @Column(name = "contacto_emergencia_telefono", length = 15)
    private String contactoEmergenciaTelefono;

    @Column(name = "alergias", columnDefinition = "TEXT")
    private String alergias;

    @Column(name = "medicamentos", columnDefinition = "TEXT")
    private String medicamentos;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @OneToMany(mappedBy = "paciente", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Cita2> citas;

    @OneToOne(mappedBy = "paciente", cascade = CascadeType.ALL, orphanRemoval = true)
    private HistoriaClinica historiaClinica;
}
