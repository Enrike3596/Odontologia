package com.odontologia.odontologia.Impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.CitaDto;
import com.odontologia.odontologia.Entity.Cita;
import com.odontologia.odontologia.Entity.EstadoCitaEnum;
import com.odontologia.odontologia.Entity.Paciente;
import com.odontologia.odontologia.Repository.CitaRepository;
import com.odontologia.odontologia.Repository.PacienteRepository;
import com.odontologia.odontologia.Service.CitaService;

@Service
public class CitaServiceImpl implements CitaService {
    
    @Autowired
    private CitaRepository citaRepository;
    
    @Autowired
    private PacienteRepository pacienteRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    public List<CitaDto> listarCitas() {
        List<Cita> citas = citaRepository.findAll();
        return citas.stream()
                .map(this::convertirEntityADto)
                .collect(Collectors.toList());
    }

    @Override
    public CitaDto obtenerCitaPorId(Long id) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
        return convertirEntityADto(cita);
    }

    @Override
    public CitaDto crearCita(CitaDto citaDto) {
        // Validar que el paciente existe
        Paciente paciente = pacienteRepository.findById(citaDto.getPacienteId())
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + citaDto.getPacienteId()));
        
        Cita cita = convertirDtoAEntity(citaDto);
        cita.setPaciente(paciente);
        
        Cita citaGuardada = citaRepository.save(cita);
        return convertirEntityADto(citaGuardada);
    }

    @Override
    public CitaDto actualizarCita(Long id, CitaDto citaDto) {
        Cita citaExistente = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
        
        // Validar que el paciente existe si se está cambiando
        if (citaDto.getPacienteId() != null && !citaDto.getPacienteId().equals(citaExistente.getPaciente().getId())) {
            Paciente nuevoPaciente = pacienteRepository.findById(citaDto.getPacienteId())
                    .orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + citaDto.getPacienteId()));
            citaExistente.setPaciente(nuevoPaciente);
        }
        
        // Actualizar los campos de la cita existente
        if (citaDto.getFecha() != null) {
            citaExistente.setFecha(LocalDate.parse(citaDto.getFecha(), DATE_FORMATTER));
        }
        if (citaDto.getHora() != null) {
            citaExistente.setHora(LocalTime.parse(citaDto.getHora(), TIME_FORMATTER));
        }
        if (citaDto.getOdontologo() != null) {
            citaExistente.setOdontologo(citaDto.getOdontologo());
        }
        if (citaDto.getEstado() != null) {
            citaExistente.setEstado(EstadoCitaEnum.valueOf(citaDto.getEstado()));
        }
        
        Cita citaActualizada = citaRepository.save(citaExistente);
        return convertirEntityADto(citaActualizada);
    }

    @Override
    public void eliminarCita(Long id) {
        if (!citaRepository.existsById(id)) {
            throw new RuntimeException("Cita no encontrada con ID: " + id);
        }
        citaRepository.deleteById(id);
    }

    // Métodos auxiliares para conversión entre DTO y Entity
    private CitaDto convertirEntityADto(Cita cita) {
        CitaDto dto = new CitaDto();
        dto.setId(cita.getId());
        dto.setPacienteId(cita.getPaciente().getId());
        dto.setPacienteNombre(cita.getPaciente().getNombre());
        dto.setPacienteDocumento(cita.getPaciente().getDocumento());
        dto.setPacienteTelefono(cita.getPaciente().getTelefono());
        dto.setPacienteCorreo(cita.getPaciente().getCorreo());
        dto.setFecha(cita.getFecha() != null ? cita.getFecha().format(DATE_FORMATTER) : null);
        dto.setHora(cita.getHora() != null ? cita.getHora().format(TIME_FORMATTER) : null);
        dto.setOdontologo(cita.getOdontologo());
        dto.setEstado(cita.getEstado() != null ? cita.getEstado().name() : null);
        return dto;
    }

    private Cita convertirDtoAEntity(CitaDto citaDto) {
        Cita cita = new Cita();
        cita.setId(citaDto.getId());
        
        // La fecha y hora se parsean desde String
        if (citaDto.getFecha() != null) {
            cita.setFecha(LocalDate.parse(citaDto.getFecha(), DATE_FORMATTER));
        }
        if (citaDto.getHora() != null) {
            cita.setHora(LocalTime.parse(citaDto.getHora(), TIME_FORMATTER));
        }
        
        cita.setOdontologo(citaDto.getOdontologo());
        
        // Convertir estado de String a Enum
        if (citaDto.getEstado() != null) {
            cita.setEstado(EstadoCitaEnum.valueOf(citaDto.getEstado()));
        } else {
            cita.setEstado(EstadoCitaEnum.PENDIENTE); // Estado por defecto
        }
        
        // Nota: El paciente se asigna en los métodos de crear/actualizar
        return cita;
    }
}
