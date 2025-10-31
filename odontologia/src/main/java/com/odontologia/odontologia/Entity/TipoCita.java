package com.odontologia.odontologia.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "tipos_cita")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TipoCita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @OneToMany(mappedBy = "tipoCita", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Cita2> citas;
}
