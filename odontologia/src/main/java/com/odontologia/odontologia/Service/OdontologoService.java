package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.OdontologoDto;

public interface OdontologoService {
    // aqui van los metodos del servicio
    List<OdontologoDto> listarOdontologos();
    OdontologoDto obtenerOdontologoPorId(Long id);
    /** Odontólogos asociados a una especialidad (módulo agendar citas: tipo de cita = especialidad). */
    List<OdontologoDto> listarPorEspecialidad(String especialidad);
    OdontologoDto crearOdontologo(OdontologoDto odontologoDto);
    OdontologoDto actualizarOdontologo(Long id, OdontologoDto odontologoDto);
    void eliminarOdontologo(Long id);
}
