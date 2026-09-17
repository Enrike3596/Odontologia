package com.odontologia.odontologia.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Token de recuperación de contraseña (código de 6 dígitos).
 * En BD solo se guarda el SHA-256 del código (nunca el código en plano),
 * con vigencia de 15 minutos y marca de uso único.
 */
@Entity
@Table(name = "password_reset_tokens",
        indexes = @Index(name = "idx_reset_codigo", columnList = "codigoHash"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(length = 64, nullable = false)
    private String codigoHash;

    @Column(nullable = false)
    private LocalDateTime expiraEn;

    @Column(nullable = false)
    private Boolean usado = false;

    @Column(nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();
}
