package com.odontologia.odontologia.Enums;

/**
 * Tipo de movimiento manual sobre la agenda del odontólogo.
 * BLOQUEO: cierre de un día completo o de un rango horario.
 * APERTURA_EXTRA: habilita turnos fuera del horario base
 * (días no laborables u horas extendidas).
 */
public enum TipoMovimientoAgenda {
    BLOQUEO,
    APERTURA_EXTRA
}
