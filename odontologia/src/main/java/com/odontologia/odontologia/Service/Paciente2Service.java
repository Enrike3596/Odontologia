package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.Paciente2Dto;

public interface Paciente2Service {
    // aqui van los metodos del servicio
    List<Paciente2Dto> listarPacientes();
    Paciente2Dto obtenerPacientePorId(Long id);
    Paciente2Dto crearPaciente(Paciente2Dto pacienteDto);
    Paciente2Dto actualizarPaciente(Long id, Paciente2Dto pacienteDto);
    void eliminarPaciente(Long id);
}
