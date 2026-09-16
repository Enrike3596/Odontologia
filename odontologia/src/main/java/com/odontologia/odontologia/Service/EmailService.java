package com.odontologia.odontologia.Service;

import com.odontologia.odontologia.Dto.Cita2Dto;

/**
 * Envío de correos de citas (punto 2 del plan de acción).
 * Implementación asíncrona: nunca bloquea ni rompe la creación de la cita.
 */
public interface EmailService {

    /**
     * Correos al asignar una cita:
     * 1) confirmación al email del paciente (si tiene y el opt-in lo permite),
     * 2) copia informativa al email del usuario que agenda (si se proveyó).
     */
    void notificarCitaAgendada(Cita2Dto cita, Boolean enviarRecordatorio, String emailSolicitante);

    /** Recordatorio de una cita próxima (job programado). */
    void enviarRecordatorio(Cita2Dto cita);
}
