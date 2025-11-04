package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.Paciente2Dto;
import com.odontologia.odontologia.Entity.Paciente2;
import com.odontologia.odontologia.Repository.Paciente2Repository;
import com.odontologia.odontologia.Service.Paciente2Service;

@Service
public class Paciente2ServiceImpl  implements Paciente2Service {

	@Autowired
	private Paciente2Repository paciente2Repository;

	@Override
	public List<Paciente2Dto> listarPacientes() {
		List<Paciente2> list = paciente2Repository.findAll();
		return list.stream().map(this::convertirEntityADto).collect(Collectors.toList());
	}

	@Override
	public Paciente2Dto obtenerPacientePorId(Long id) {
		Paciente2 p = paciente2Repository.findById(id)
				.orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + id));
		return convertirEntityADto(p);
	}

	@Override
	public Paciente2Dto crearPaciente(Paciente2Dto pacienteDto) {
		Paciente2 p = convertirDtoAEntity(pacienteDto);
		Paciente2 guardado = paciente2Repository.save(p);
		return convertirEntityADto(guardado);
	}

	@Override
	public Paciente2Dto actualizarPaciente(Long id, Paciente2Dto pacienteDto) {
		Paciente2 existente = paciente2Repository.findById(id)
				.orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + id));

		existente.setNombre(pacienteDto.getNombre());
		existente.setApellido(pacienteDto.getApellido());
		existente.setEmail(pacienteDto.getEmail());
		existente.setTelefono(pacienteDto.getTelefono());

		Paciente2 actualizado = paciente2Repository.save(existente);
		return convertirEntityADto(actualizado);
	}

	@Override
	public void eliminarPaciente(Long id) {
		if (!paciente2Repository.existsById(id)) {
			throw new RuntimeException("Paciente no encontrado con ID: " + id);
		}
		paciente2Repository.deleteById(id);
	}

	private Paciente2Dto convertirEntityADto(Paciente2 p) {
		Paciente2Dto dto = new Paciente2Dto();
		dto.setId(p.getId());
		dto.setNombre(p.getNombre());
		dto.setApellido(p.getApellido());
		dto.setEmail(p.getEmail());
		dto.setTelefono(p.getTelefono());
		return dto;
	}

	private Paciente2 convertirDtoAEntity(Paciente2Dto dto) {
		Paciente2 p = new Paciente2();
		p.setId(dto.getId());
		p.setNombre(dto.getNombre());
		p.setApellido(dto.getApellido());
		p.setEmail(dto.getEmail());
		p.setTelefono(dto.getTelefono());
		return p;
	}
}
