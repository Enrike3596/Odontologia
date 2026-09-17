package com.odontologia.odontologia.Config;

import java.io.Serializable;

/**
 * Identidad mínima guardada en la sesión HTTP tras un login exitoso.
 * Solo IDs y nombres (nunca la contraseña ni el hash).
 */
public record AuthPrincipal(Long id, String username, String rolNombre) implements Serializable {

    /** Authority Spring usada en las reglas hasRole (sin el prefijo ROLE_). */
    public String authority() {
        return Roles.authorityOf(rolNombre);
    }
}
