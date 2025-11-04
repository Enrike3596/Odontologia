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
}
