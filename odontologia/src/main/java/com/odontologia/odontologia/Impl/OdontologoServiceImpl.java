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

		// Actualizar todos los campos
		existente.setNombre(odontologoDto.getNombre());
		existente.setApellido(odontologoDto.getApellido());
		existente.setMatricula(odontologoDto.getMatricula());
		existente.setTipoDocumento(odontologoDto.getTipoDocumento());
		existente.setDocumento(odontologoDto.getDocumento());
		existente.setFechaNacimiento(odontologoDto.getFechaNacimiento());
		existente.setGenero(odontologoDto.getGenero());
		existente.setEmail(odontologoDto.getEmail());
		existente.setTelefono(odontologoDto.getTelefono());
		existente.setDireccion(odontologoDto.getDireccion());
		existente.setUniversidad(odontologoDto.getUniversidad());
		existente.setAnoGraduacion(odontologoDto.getAnoGraduacion());
		existente.setExperiencia(odontologoDto.getExperiencia());
		existente.setEspecialidades(odontologoDto.getEspecialidades());
		existente.setContactoEmergenciaNombre(odontologoDto.getContactoEmergenciaNombre());
		existente.setContactoEmergenciaParentesco(odontologoDto.getContactoEmergenciaParentesco());
		existente.setContactoEmergenciaTelefono(odontologoDto.getContactoEmergenciaTelefono());
		existente.setDiasTrabajo(odontologoDto.getDiasTrabajo());
		existente.setHoraInicio(odontologoDto.getHoraInicio());
		existente.setHoraFin(odontologoDto.getHoraFin());
		existente.setObservaciones(odontologoDto.getObservaciones());

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
		dto.setTipoDocumento(o.getTipoDocumento());
		dto.setDocumento(o.getDocumento());
		dto.setFechaNacimiento(o.getFechaNacimiento());
		dto.setGenero(o.getGenero());
		dto.setEmail(o.getEmail());
		dto.setTelefono(o.getTelefono());
		dto.setDireccion(o.getDireccion());
		dto.setUniversidad(o.getUniversidad());
		dto.setAnoGraduacion(o.getAnoGraduacion());
		dto.setExperiencia(o.getExperiencia());
		dto.setEspecialidades(o.getEspecialidades());
		dto.setContactoEmergenciaNombre(o.getContactoEmergenciaNombre());
		dto.setContactoEmergenciaParentesco(o.getContactoEmergenciaParentesco());
		dto.setContactoEmergenciaTelefono(o.getContactoEmergenciaTelefono());
		dto.setDiasTrabajo(o.getDiasTrabajo());
		dto.setHoraInicio(o.getHoraInicio());
		dto.setHoraFin(o.getHoraFin());
		dto.setObservaciones(o.getObservaciones());
		return dto;
	}

	private Odontologo convertirDtoAEntity(OdontologoDto dto) {
		Odontologo o = new Odontologo();
		o.setId(dto.getId());
		o.setNombre(dto.getNombre());
		o.setApellido(dto.getApellido());
		o.setMatricula(dto.getMatricula());
		o.setTipoDocumento(dto.getTipoDocumento());
		o.setDocumento(dto.getDocumento());
		o.setFechaNacimiento(dto.getFechaNacimiento());
		o.setGenero(dto.getGenero());
		o.setEmail(dto.getEmail());
		o.setTelefono(dto.getTelefono());
		o.setDireccion(dto.getDireccion());
		o.setUniversidad(dto.getUniversidad());
		o.setAnoGraduacion(dto.getAnoGraduacion());
		o.setExperiencia(dto.getExperiencia());
		o.setEspecialidades(dto.getEspecialidades());
		o.setContactoEmergenciaNombre(dto.getContactoEmergenciaNombre());
		o.setContactoEmergenciaParentesco(dto.getContactoEmergenciaParentesco());
		o.setContactoEmergenciaTelefono(dto.getContactoEmergenciaTelefono());
		o.setDiasTrabajo(dto.getDiasTrabajo());
		o.setHoraInicio(dto.getHoraInicio());
		o.setHoraFin(dto.getHoraFin());
		o.setObservaciones(dto.getObservaciones());
		return o;
	}
}
