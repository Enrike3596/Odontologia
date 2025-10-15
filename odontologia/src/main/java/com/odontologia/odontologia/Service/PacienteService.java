package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.PacienteDto;

public interface PacienteService {
    
    // aqui van los metodos del servicio

    List<PacienteDto> listarPacientes();
    PacienteDto obtenerPacientePorId(Long id);
    PacienteDto crearPaciente(PacienteDto pacienteDto);
    PacienteDto actualizarPaciente(Long id, PacienteDto pacienteDto);
    void eliminarPaciente(Long id);
}
