package com.odontologia.odontologia.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

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

    @Column(length = 150, nullable = false, unique = true)
    private String email;

    @Column(length = 15, nullable = false)
    private String telefono;

    @Column(length = 255)
    private String direccion;

    @Column(length = 50, nullable = false, unique = true)
    private String username;

    @Column(length = 100, nullable = false)
    private String password;

    @Column(nullable = false)
    private Boolean activo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rol_id", nullable = false)
    private Rol rol;
}
