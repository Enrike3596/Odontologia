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
     * Recordatorio de la cita por correo (acción independiente de la confirmación):
     * solo un día antes de la cita (fecha == mañana). Envía el correo al
     * paciente y marca recordatorioEnviado. No cambia el estado.
     */
    Cita2Dto enviarRecordatorio(Long id);
}
