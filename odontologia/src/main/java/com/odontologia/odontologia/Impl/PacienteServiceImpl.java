package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.PacienteDto;
import com.odontologia.odontologia.Entity.Paciente;
import com.odontologia.odontologia.Repository.PacienteRepository;
import com.odontologia.odontologia.Service.PacienteService;

@Service
public class PacienteServiceImpl implements PacienteService {
    
    @Autowired
    private PacienteRepository pacienteRepository;

    @Override
    public List<PacienteDto> listarPacientes() {
        List<Paciente> pacientes = pacienteRepository.findAll();
        return pacientes.stream()
                .map(this::convertirEntityADto)
                .collect(Collectors.toList());
    }

    @Override
    public PacienteDto obtenerPacientePorId(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + id));
        return convertirEntityADto(paciente);
    }

    @Override
    public PacienteDto crearPaciente(PacienteDto pacienteDto) {
        Paciente paciente = convertirDtoAEntity(pacienteDto);
        Paciente pacienteGuardado = pacienteRepository.save(paciente);
        return convertirEntityADto(pacienteGuardado);
    }

    @Override
    public PacienteDto actualizarPaciente(Long id, PacienteDto pacienteDto) {
        Paciente pacienteExistente = pacienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + id));
        
        // Actualizar los campos del paciente existente
        pacienteExistente.setNombre(pacienteDto.getNombre());
        pacienteExistente.setDocumento(pacienteDto.getDocumento());
        pacienteExistente.setTelefono(pacienteDto.getTelefono());
        pacienteExistente.setCorreo(pacienteDto.getCorreo());
        
        Paciente pacienteActualizado = pacienteRepository.save(pacienteExistente);
        return convertirEntityADto(pacienteActualizado);
    }

    @Override
    public void eliminarPaciente(Long id) {
        if (!pacienteRepository.existsById(id)) {
            throw new RuntimeException("Paciente no encontrado con ID: " + id);
        }
        pacienteRepository.deleteById(id);
    }

    // Métodos auxiliares para conversión entre DTO y Entity
    private PacienteDto convertirEntityADto(Paciente paciente) {
        PacienteDto dto = new PacienteDto();
        dto.setId(paciente.getId());
        dto.setNombre(paciente.getNombre());
        dto.setDocumento(paciente.getDocumento());
        dto.setTelefono(paciente.getTelefono());
        dto.setCorreo(paciente.getCorreo());
        return dto;
    }

    private Paciente convertirDtoAEntity(PacienteDto pacienteDto) {
        Paciente paciente = new Paciente();
        paciente.setId(pacienteDto.getId());
        paciente.setNombre(pacienteDto.getNombre());
        paciente.setDocumento(pacienteDto.getDocumento());
        paciente.setTelefono(pacienteDto.getTelefono());
        paciente.setCorreo(pacienteDto.getCorreo());
        return paciente;
    }
}
