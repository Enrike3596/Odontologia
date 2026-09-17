package com.odontologia.odontologia.Config;

/**
 * Mapeo entre los nombres de rol de la BD (roles.nombre:
 * Administrador, Odontólogo, Recepcionista) y las authorities de
 * Spring Security. Un solo punto de verdad para el backend y las
 * reglas de {@code SecurityConfig}.
 */
public final class Roles {

    public static final String ADMIN = "ROLE_ADMIN";
    public static final String ODONTOLOGO = "ROLE_ODONTOLOGO";
    public static final String RECEPCIONISTA = "ROLE_RECEPCIONISTA";
    public static final String USER = "ROLE_USER";

    private Roles() {
    }

    public static String authorityOf(String nombreRol) {
        String t = nombreRol == null ? "" : nombreRol.toLowerCase();
        if (t.contains("admin")) {
            return ADMIN;
        }
        if (t.contains("odont") || t.contains("doctor")) {
            return ODONTOLOGO;
        }
        if (t.contains("recep")) {
            return RECEPCIONISTA;
        }
        return USER;
    }
}
