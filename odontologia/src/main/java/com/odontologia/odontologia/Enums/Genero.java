package com.odontologia.odontologia.Enums;

/**
 * Catálogo cerrado de género. La columna se mantiene VARCHAR(1)
 * y la pertenencia al catálogo se valida en la capa de servicio.
 */
public enum Genero {
    M("M", "Masculino"),
    F("F", "Femenino"),
    O("O", "Otro");

    private final String codigo;
    private final String etiqueta;

    Genero(String codigo, String etiqueta) {
        this.codigo = codigo;
        this.etiqueta = etiqueta;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    /**
     * Normaliza un valor libre al código del catálogo.
     * Acepta el código o la etiqueta (ignora mayúsculas y espacios).
     * @throws IllegalArgumentException si no pertenece al catálogo.
     */
    public static Genero desde(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("El género es requerido");
        }
        String v = valor.trim().toUpperCase();
        for (Genero g : values()) {
            if (g.codigo.equals(v) || g.etiqueta.toUpperCase().equals(v)) {
                return g;
            }
        }
        throw new IllegalArgumentException("Género no válido: " + valor);
    }
}
