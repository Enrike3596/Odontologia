package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.OdontologoDto;

public interface OdontologoService {
    // aqui van los metodos del servicio
    List<OdontologoDto> listarOdontologos();
    OdontologoDto obtenerOdontologoPorId(Long id);
    OdontologoDto crearOdontologo(OdontologoDto odontologoDto);
    OdontologoDto actualizarOdontologo(Long id, OdontologoDto odontologoDto);
    void eliminarOdontologo(Long id);
}
