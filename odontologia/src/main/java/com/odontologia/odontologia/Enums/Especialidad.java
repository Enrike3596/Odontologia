package com.odontologia.odontologia.Enums;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Catálogo cerrado de especialidades odontológicas.
 * Única fuente de verdad para:
 * <ul>
 *   <li>{@code odontologos.especialidades} (lista separada por comas, normalizada al guardar),</li>
 *   <li>{@code tipos_cita.nombre} (debe ser exactamente un valor del catálogo),</li>
 *   <li>filtros por especialidad (cita ↔ odontólogo) y checkboxes del frontend.</li>
 * </ul>
 */
public enum Especialidad {
    ODONTOLOGIA_GENERAL("ODONTOLOGIA_GENERAL", "Odontología General"),
    ORTODONCIA("ORTODONCIA", "Ortodoncia"),
    ENDODONCIA("ENDODONCIA", "Endodoncia"),
    PERIODONCIA("PERIODONCIA", "Periodoncia"),
    CIRUGIA_ORAL("CIRUGIA_ORAL", "Cirugía Oral"),
    PROTESIS_DENTAL("PROTESIS_DENTAL", "Prótesis Dental"),
    ODONTOPEDIATRIA("ODONTOPEDIATRIA", "Odontopediatría"),
    ESTETICA_DENTAL("ESTETICA_DENTAL", "Estética Dental"),
    IMPLANTOLOGIA("IMPLANTOLOGIA", "Implantología"),
    LIMPIEZA_DENTAL("LIMPIEZA_DENTAL", "Limpieza Dental"),
    VALORACION("VALORACION", "Valoración");

    private final String codigo;
    private final String etiqueta;

    Especialidad(String codigo, String etiqueta) {
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
     * Normaliza un valor libre a la etiqueta del catálogo.
     * Acepta el código o la etiqueta (ignora mayúsculas, tildes y espacios).
     * @throws IllegalArgumentException si no pertenece al catálogo.
     */
    public static Especialidad desde(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("La especialidad es requerida");
        }
        String v = sinTildes(valor.trim());
        for (Especialidad e : values()) {
            if (e.codigo.equalsIgnoreCase(v) || sinTildes(e.etiqueta).equalsIgnoreCase(v)) {
                return e;
            }
        }
        throw new IllegalArgumentException("Especialidad no válida: " + valor
                + ". Valores permitidos: " + etiquetas());
    }

    /**
     * Normaliza una lista separada por comas o punto y coma a etiquetas
     * canónicas separadas por coma (sin duplicados).
     * @throws IllegalArgumentException si algún elemento no pertenece al catálogo.
     */
    public static String normalizarLista(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("Se requiere al menos una especialidad");
        }
        Set<String> etiquetas = new LinkedHashSet<>();
        for (String token : valor.split("[,;]")) {
            if (token == null || token.trim().isEmpty()) {
                continue;
            }
            etiquetas.add(desde(token).getEtiqueta());
        }
        if (etiquetas.isEmpty()) {
            throw new IllegalArgumentException("Se requiere al menos una especialidad");
        }
        return String.join(", ", etiquetas);
    }

    /** Etiquetas del catálogo separadas por coma (para mensajes de error). */
    public static String etiquetas() {
        List<String> lista = new ArrayList<>();
        for (Especialidad e : values()) {
            lista.add(e.etiqueta);
        }
        return String.join(", ", lista);
    }

    private static String sinTildes(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).trim();
    }
}
