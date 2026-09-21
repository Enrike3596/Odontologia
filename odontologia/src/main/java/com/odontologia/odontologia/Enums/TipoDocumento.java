package com.odontologia.odontologia.Enums;

/**
 * Catálogo cerrado de tipos de documento (DIAN / Registraduría).
 * Se valida en la capa de servicio; la columna se mantiene VARCHAR
 * para no romper datos históricos (ver normalización en base.sql).
 */
public enum TipoDocumento {
    CC("CC", "Cédula de Ciudadanía"),
    CE("CE", "Cédula de Extranjería"),
    TI("TI", "Tarjeta de Identidad"),
    PP("PP", "Pasaporte"),
    PA("PA", "Pasaporte Andino"),
    RC("RC", "Registro Civil");

    private final String codigo;
    private final String etiqueta;

    TipoDocumento(String codigo, String etiqueta) {
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
    public static TipoDocumento desde(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("El tipo de documento es requerido");
        }
        String v = valor.trim().toUpperCase();
        for (TipoDocumento t : values()) {
            if (t.codigo.equals(v) || t.etiqueta.toUpperCase().equals(v)) {
                return t;
            }
        }
        throw new IllegalArgumentException("Tipo de documento no válido: " + valor);
    }
}
