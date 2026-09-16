package com.odontologia.odontologia.Entity;

/**
 * Catálogo de parentescos para el contacto de emergencia.
 * Incluye OTRO con texto libre: si el valor no coincide con el catálogo
 * se conserva tal cual (modo laxo) para no perder información histórica.
 */
public enum Parentesco {
    PADRE("Padre"),
    MADRE("Madre"),
    ESPOSO("Esposo"),
    ESPOSA("Esposa"),
    HIJO("Hijo"),
    HIJA("Hija"),
    HERMANO("Hermano"),
    HERMANA("Hermana"),
    ABUELO("Abuelo"),
    ABUELA("Abuela"),
    TIO("Tío"),
    TIA("Tía"),
    PRIMO("Primo"),
    PRIMA("Prima"),
    AMIGO("Amigo"),
    AMIGA("Amiga"),
    TUTOR("Tutor legal"),
    OTRO("Otro");

    private final String etiqueta;

    Parentesco(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    /**
     * Normaliza un valor libre a la etiqueta del catálogo.
     * Si no coincide con ningún valor conocido, devuelve el texto
     * original recortado (equivale a OTRO con detalle libre).
     * @throws IllegalArgumentException si el valor es vacío.
     */
    public static String normalizar(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("El parentesco del contacto de emergencia es requerido");
        }
        String v = valor.trim();
        for (Parentesco p : values()) {
            if (p.etiqueta.equalsIgnoreCase(v)) {
                return p.etiqueta;
            }
        }
        return v;
    }
}
