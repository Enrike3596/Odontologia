package com.odontologia.odontologia.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "citas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con Paciente
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    private LocalDate fecha;
    private LocalTime hora;

    @Column(length = 100)
    private String odontologo;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EstadoCitaEnum estado = EstadoCitaEnum.PENDIENTE;
}
