package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.TipoCitaDto;

public interface TipoCitaService {
    // aqui van los metodos del servicio
    List<TipoCitaDto> listarTipoCitas();
    TipoCitaDto obtenerTipoCitaPorId(Long id);
    TipoCitaDto crearTipoCita(TipoCitaDto tipoCitaDto);
    TipoCitaDto actualizarTipoCita(Long id, TipoCitaDto tipoCitaDto);
    void eliminarTipoCita(Long id);
}
