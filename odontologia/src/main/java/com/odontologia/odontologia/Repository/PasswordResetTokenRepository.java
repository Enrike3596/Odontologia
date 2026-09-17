package com.odontologia.odontologia.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.odontologia.odontologia.Entity.PasswordResetToken;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByCodigoHashAndUsadoFalseAndExpiraEnAfter(
            String codigoHash, LocalDateTime ahora);

    List<PasswordResetToken> findByUsuarioIdAndUsadoFalse(Long usuarioId);

    void deleteByExpiraEnBefore(LocalDateTime fecha);
}
