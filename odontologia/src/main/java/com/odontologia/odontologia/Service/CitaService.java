package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.CitaDto;

public interface CitaService {
    // aqui van los metodos del servicio

    List<CitaDto> listarCitas();
    CitaDto obtenerCitaPorId(Long id);
    CitaDto crearCita(CitaDto citaDto);
    CitaDto actualizarCita(Long id, CitaDto citaDto);
    void eliminarCita(Long id);
}
