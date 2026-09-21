package com.odontologia.odontologia.Entity;

import jakarta.persistence.*;
import lombok.*;

import com.odontologia.odontologia.Enums.TipoMovimientoAgenda;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Movimiento manual de apertura/cierre sobre la agenda de un odontólogo.
 * La agenda base se deriva de diasTrabajo + horaInicio/horaFin del
 * odontólogo; estos registros la ajustan día por día (modo mixto).
 * Si horaInicio/horaFin son NULL, el movimiento aplica al día completo.
 */
@Entity
@Table(name = "bloqueos_agenda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BloqueoAgenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "odontologo_id", nullable = false)
    private Odontologo odontologo;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio")
    private LocalTime horaInicio;

    @Column(name = "hora_fin")
    private LocalTime horaFin;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TipoMovimientoAgenda tipo = TipoMovimientoAgenda.BLOQUEO;

    @Column(length = 255)
    private String motivo;

    @Column(nullable = false)
    private Boolean activo = true;
}
