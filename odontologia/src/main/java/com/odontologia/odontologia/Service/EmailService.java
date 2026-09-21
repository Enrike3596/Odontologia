package com.odontologia.odontologia.Service;

import com.odontologia.odontologia.Dto.Cita2Dto;

/**
 * Envío de correos de citas (punto 2 del plan de acción).
 * Implementación asíncrona: nunca bloquea ni rompe la creación de la cita.
 */
public interface EmailService {

    /**
     * Confirmación al asignar una cita: solo al email del paciente
     * (si tiene y el opt-in lo permite). Nadie más recibe copia.
     */
    void notificarCitaAgendada(Cita2Dto cita, Boolean enviarRecordatorio);

    /** Recordatorio de una cita próxima (job programado). */
    void enviarRecordatorio(Cita2Dto cita);

    /** Código de recuperación de contraseña (6 dígitos, 15 min de vigencia). */
    void enviarCodigoRecuperacion(String destinatario, String nombre, String codigo);
}
