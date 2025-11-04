package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.RolDto;
import com.odontologia.odontologia.Entity.Rol;
import com.odontologia.odontologia.Repository.RolRepository;
import com.odontologia.odontologia.Service.RolService;

@Service
public class RolServiceImpl implements RolService {

	@Autowired
	private RolRepository rolRepository;

	@Override
	public List<RolDto> listarRoles() {
		List<Rol> list = rolRepository.findAll();
		return list.stream().map(this::convertirEntityADto).collect(Collectors.toList());
	}

	@Override
	public RolDto obtenerRolPorId(Long id) {
		Rol r = rolRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Rol no encontrado con ID: " + id));
		return convertirEntityADto(r);
	}

	@Override
	public RolDto crearRol(RolDto rolDto) {
		Rol r = convertirDtoAEntity(rolDto);
		Rol guardado = rolRepository.save(r);
		return convertirEntityADto(guardado);
	}

	@Override
	public RolDto actualizarRol(Long id, RolDto rolDto) {
		Rol existente = rolRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Rol no encontrado con ID: " + id));

		existente.setNombre(rolDto.getNombre());

		Rol actualizado = rolRepository.save(existente);
		return convertirEntityADto(actualizado);
	}

	@Override
	public void eliminarRol(Long id) {
		if (!rolRepository.existsById(id)) {
			throw new RuntimeException("Rol no encontrado con ID: " + id);
		}
		rolRepository.deleteById(id);
	}

	private RolDto convertirEntityADto(Rol r) {
		RolDto dto = new RolDto();
		dto.setId(r.getId());
		dto.setNombre(r.getNombre());
		return dto;
	}

	private Rol convertirDtoAEntity(RolDto dto) {
		Rol r = new Rol();
		r.setId(dto.getId());
		r.setNombre(dto.getNombre());
		return r;
	}
}
