package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.OdontologoDto;
import com.odontologia.odontologia.Entity.Odontologo;
import com.odontologia.odontologia.Repository.OdontologoRepository;
import com.odontologia.odontologia.Service.OdontologoService;

@Service
public class OdontologoServiceImpl implements OdontologoService {

	@Autowired
	private OdontologoRepository odontologoRepository;

	@Override
	public List<OdontologoDto> listarOdontologos() {
		List<Odontologo> list = odontologoRepository.findAll();
		return list.stream().map(this::convertirEntityADto).collect(Collectors.toList());
	}

	@Override
	public OdontologoDto obtenerOdontologoPorId(Long id) {
		Odontologo o = odontologoRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Odontólogo no encontrado con ID: " + id));
		return convertirEntityADto(o);
	}

	@Override
	public OdontologoDto crearOdontologo(OdontologoDto odontologoDto) {
		Odontologo o = convertirDtoAEntity(odontologoDto);
		Odontologo guardado = odontologoRepository.save(o);
		return convertirEntityADto(guardado);
	}

	@Override
	public OdontologoDto actualizarOdontologo(Long id, OdontologoDto odontologoDto) {
		Odontologo existente = odontologoRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Odontólogo no encontrado con ID: " + id));

		existente.setNombre(odontologoDto.getNombre());
		existente.setApellido(odontologoDto.getApellido());
		existente.setMatricula(odontologoDto.getMatricula());

		Odontologo actualizado = odontologoRepository.save(existente);
		return convertirEntityADto(actualizado);
	}

	@Override
	public void eliminarOdontologo(Long id) {
		if (!odontologoRepository.existsById(id)) {
			throw new RuntimeException("Odontólogo no encontrado con ID: " + id);
		}
		odontologoRepository.deleteById(id);
	}

	private OdontologoDto convertirEntityADto(Odontologo o) {
		OdontologoDto dto = new OdontologoDto();
		dto.setId(o.getId());
		dto.setNombre(o.getNombre());
		dto.setApellido(o.getApellido());
		dto.setMatricula(o.getMatricula());
		return dto;
	}

	private Odontologo convertirDtoAEntity(OdontologoDto dto) {
		Odontologo o = new Odontologo();
		o.setId(dto.getId());
		o.setNombre(dto.getNombre());
		o.setApellido(dto.getApellido());
		o.setMatricula(dto.getMatricula());
		return o;
	}
}
