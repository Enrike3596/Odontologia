package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.Cita2Dto;

public interface Cita2Service {
    // aqui van los metodos del servicio
    List<Cita2Dto> listarCitas();
    Cita2Dto obtenerCitaPorId(Long id);
    Cita2Dto crearCita(Cita2Dto citaDto);
    Cita2Dto actualizarCita(Long id, Cita2Dto citaDto);
    void eliminarCita(Long id);
    /**
     * Confirmación de la cita (acción independiente del recordatorio):
     * solo el mismo día de la cita y antes de su hora. Pasa a CONFIRMADA.
     * No envía correos.
     */
    Cita2Dto confirmarCita(Long id);
    /**
     * Finalización de la cita (la realiza el odontólogo tras atender):
     * solo desde CONFIRMADA y una vez pasada la fecha/hora asignada.
     * Pasa a FINALIZADA (terminal).
     * @param odontologoId odontólogo que finaliza; debe coincidir con el asignado.
     */
    Cita2Dto finalizarCita(Long id, Long odontologoId);
    /**
     * Barrido AUTOMÁTICO del sistema (única vía a NO_ASISTIDA):
     * cada minuto marca como NO_ASISTIDA toda cita PENDIENTE/CONFIRMADA/REPROGRAMADA
     * cuya fecha/hora + 1 minuto ya pasó. No existe marcado manual.
     * @return cantidad de citas marcadas.
     */
    int marcarVencidasComoNoAsistidas();
    /**
     * Recordatorio de la cita por correo (acción independiente de la confirmación):
     * solo un día antes de la cita (fecha == mañana). Envía el correo al
     * paciente y marca recordatorioEnviado. No cambia el estado.
     */
    Cita2Dto enviarRecordatorio(Long id);
}
