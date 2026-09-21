package com.odontologia.odontologia.Enums;

/**
 * Ciclo de vida de una cita odontológica.
 * <ul>
 *   <li>PENDIENTE: estado inicial al crear la cita.</li>
 *   <li>CONFIRMADA: el paciente confirma el mismo día, antes de la hora.</li>
 *   <li>REPROGRAMADA: se cambió fecha/hora/odontólogo (vía actualizarCita).</li>
 *   <li>FINALIZADA: el paciente fue atendido (desde CONFIRMADA, ya pasada la hora).</li>
 *   <li>NO_ASISTIDA: la marca AUTOMÁTICAMENTE el sistema 1 minuto después
 *   de la fecha/hora asignada sin asistencia. Estado terminal e inmutable,
 *   sin marcado manual.</li>
 *   <li>CANCELADA: la cita se cancela (estado terminal).</li>
 * </ul>
 * Terminales (no admiten más cambios de turno): CANCELADA, FINALIZADA, NO_ASISTIDA.
 */
public enum EstadoCitaEnum {
    PENDIENTE,
    CONFIRMADA,
    CANCELADA,
    REPROGRAMADA,
    FINALIZADA,
    NO_ASISTIDA;

    /** Estados que cierran el ciclo: no se puede confirmar, reprogramar ni finalizar. */
    public boolean esTerminal() {
        return this == CANCELADA || this == FINALIZADA || this == NO_ASISTIDA;
    }

    /** Estados que pueden confirmarse (pasar a CONFIRMADA). */
    public boolean esConfirmable() {
        return this == PENDIENTE || this == REPROGRAMADA;
    }

    /** Estados que pueden recibir recordatorio por correo. */
    public boolean admiteRecordatorio() {
        return this == PENDIENTE || this == CONFIRMADA || this == REPROGRAMADA;
    }
}
