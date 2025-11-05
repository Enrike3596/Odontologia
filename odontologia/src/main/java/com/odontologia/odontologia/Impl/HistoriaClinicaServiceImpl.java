package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.HistoriaClinicaDto;
import com.odontologia.odontologia.Dto.Paciente2Dto;
import com.odontologia.odontologia.Entity.HistoriaClinica;
import com.odontologia.odontologia.Entity.Paciente2;
import com.odontologia.odontologia.Repository.HistoriaClinicaRepository;
import com.odontologia.odontologia.Service.HistoriaClinicaService;

@Service
public class HistoriaClinicaServiceImpl implements HistoriaClinicaService{

	@Autowired
	private HistoriaClinicaRepository historiaClinicaRepository;

	@Override
	public List<HistoriaClinicaDto> listarHistoriaClinicas() {
		List<HistoriaClinica> list = historiaClinicaRepository.findAll();
		return list.stream().map(this::convertirEntityADto).collect(Collectors.toList());
	}

	@Override
	public HistoriaClinicaDto obtenerHistoriaClinicaPorId(Long id) {
		HistoriaClinica h = historiaClinicaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Historia clinica no encontrada con ID: " + id));
		return convertirEntityADto(h);
	}

	@Override
	public HistoriaClinicaDto crearHistoriaClinica(HistoriaClinicaDto historiaClinicaDto) {
		HistoriaClinica h = convertirDtoAEntity(historiaClinicaDto);
		HistoriaClinica guardada = historiaClinicaRepository.save(h);
		return convertirEntityADto(guardada);
	}

	@Override
	public HistoriaClinicaDto actualizarHistoriaClinica(Long id, HistoriaClinicaDto historiaClinicaDto) {
		HistoriaClinica existente = historiaClinicaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Historia clinica no encontrada con ID: " + id));

		existente.setAntecedentes(historiaClinicaDto.getAntecedentes());
		existente.setAlergias(historiaClinicaDto.getAlergias());
		existente.setMedicamentos(historiaClinicaDto.getMedicamentos());
		// Si el DTO trae paciente, actualizamos la referencia por id
		if (historiaClinicaDto.getPaciente() != null && historiaClinicaDto.getPaciente().getId() != null) {
			Paciente2Dto pDto = historiaClinicaDto.getPaciente();
			Paciente2 p = new Paciente2();
			p.setId(pDto.getId());
			existente.setPaciente(p);
		}

		HistoriaClinica actualizada = historiaClinicaRepository.save(existente);
		return convertirEntityADto(actualizada);
	}

	@Override
	public void eliminarHistoriaClinica(Long id) {
		if (!historiaClinicaRepository.existsById(id)) {
			throw new RuntimeException("Historia clinica no encontrada con ID: " + id);
		}
		historiaClinicaRepository.deleteById(id);
	}

	private HistoriaClinicaDto convertirEntityADto(HistoriaClinica h) {
		HistoriaClinicaDto dto = new HistoriaClinicaDto();
		dto.setId(h.getId());
		dto.setAntecedentes(h.getAntecedentes());
		dto.setAlergias(h.getAlergias());
		dto.setMedicamentos(h.getMedicamentos());
		// Solo seteamos el paciente con id si existe
		if (h.getPaciente() != null) {
			Paciente2Dto p = new Paciente2Dto();
			p.setId(h.getPaciente().getId());
			dto.setPaciente(p);
		}
		return dto;
	}

	private HistoriaClinica convertirDtoAEntity(HistoriaClinicaDto dto) {
		HistoriaClinica h = new HistoriaClinica();
		h.setId(dto.getId());
		h.setAntecedentes(dto.getAntecedentes());
		h.setAlergias(dto.getAlergias());
		h.setMedicamentos(dto.getMedicamentos());
		if (dto.getPaciente() != null && dto.getPaciente().getId() != null) {
			Paciente2 p = new Paciente2();
			p.setId(dto.getPaciente().getId());
			h.setPaciente(p);
		}
		return h;
	}
}
