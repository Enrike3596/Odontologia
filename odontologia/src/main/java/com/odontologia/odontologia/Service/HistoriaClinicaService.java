package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.HistoriaClinicaDto;

public interface HistoriaClinicaService {
    // aqui van los metodos del servicio

    List<HistoriaClinicaDto> listarHistoriaClinicas();
    HistoriaClinicaDto obtenerHistoriaClinicaPorId(Long id);
    HistoriaClinicaDto crearHistoriaClinica(HistoriaClinicaDto historiaClinicaDto);
    HistoriaClinicaDto actualizarHistoriaClinica(Long id, HistoriaClinicaDto historiaClinicaDto);
    void eliminarHistoriaClinica(Long id);
}
