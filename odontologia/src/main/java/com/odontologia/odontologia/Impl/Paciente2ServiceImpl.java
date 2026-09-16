package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.Paciente2Dto;
import com.odontologia.odontologia.Entity.Genero;
import com.odontologia.odontologia.Entity.Paciente2;
import com.odontologia.odontologia.Entity.Parentesco;
import com.odontologia.odontologia.Entity.TipoDocumento;
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
		try {
			Paciente2 p = convertirDtoAEntity(pacienteDto);
			Paciente2 guardado = paciente2Repository.save(p);
			return convertirEntityADto(guardado);
		} catch (Exception e) {
			throw new RuntimeException("Error al crear paciente: " + e.getMessage(), e);
		}
	}

	@Override
	public Paciente2Dto actualizarPaciente(Long id, Paciente2Dto pacienteDto) {
		Paciente2 existente = paciente2Repository.findById(id)
				.orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + id));

		existente.setNombres(pacienteDto.getNombres());
		existente.setApellidos(pacienteDto.getApellidos());
		existente.setTipoDocumento(normalizarTipoDocumento(pacienteDto.getTipoDocumento()));
		existente.setDocumento(validarDocumento(pacienteDto.getTipoDocumento(), pacienteDto.getDocumento()));
		existente.setFechaNacimiento(pacienteDto.getFechaNacimiento());
		existente.setGenero(normalizarGenero(pacienteDto.getGenero()));
		existente.setEmail(pacienteDto.getEmail());
		existente.setTelefono(pacienteDto.getTelefono());
		existente.setDireccion(pacienteDto.getDireccion());
		existente.setContactoEmergenciaNombre(pacienteDto.getContactoEmergenciaNombre());
		existente.setContactoEmergenciaParentesco(Parentesco.normalizar(pacienteDto.getContactoEmergenciaParentesco()));
		existente.setContactoEmergenciaTelefono(pacienteDto.getContactoEmergenciaTelefono());
		existente.setAlergias(pacienteDto.getAlergias());
		existente.setMedicamentos(pacienteDto.getMedicamentos());
		existente.setObservaciones(pacienteDto.getObservaciones());

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
		dto.setNombres(p.getNombres());
		dto.setApellidos(p.getApellidos());
		dto.setTipoDocumento(p.getTipoDocumento());
		dto.setDocumento(p.getDocumento());
		dto.setFechaNacimiento(p.getFechaNacimiento());
		dto.setGenero(p.getGenero());
		dto.setEmail(p.getEmail());
		dto.setTelefono(p.getTelefono());
		dto.setDireccion(p.getDireccion());
		dto.setContactoEmergenciaNombre(p.getContactoEmergenciaNombre());
		dto.setContactoEmergenciaParentesco(p.getContactoEmergenciaParentesco());
		dto.setContactoEmergenciaTelefono(p.getContactoEmergenciaTelefono());
		dto.setAlergias(p.getAlergias());
		dto.setMedicamentos(p.getMedicamentos());
		dto.setObservaciones(p.getObservaciones());
		return dto;
	}

	private Paciente2 convertirDtoAEntity(Paciente2Dto dto) {
		Paciente2 p = new Paciente2();
		// No establecer ID para nuevos registros
		if (dto.getId() != null) {
			p.setId(dto.getId());
		}
		p.setNombres(dto.getNombres());
		p.setApellidos(dto.getApellidos());
		p.setTipoDocumento(normalizarTipoDocumento(dto.getTipoDocumento()));
		p.setDocumento(validarDocumento(dto.getTipoDocumento(), dto.getDocumento()));
		p.setFechaNacimiento(dto.getFechaNacimiento());
		p.setGenero(normalizarGenero(dto.getGenero()));
		p.setEmail(dto.getEmail());
		p.setTelefono(dto.getTelefono());
		p.setDireccion(dto.getDireccion());
		p.setContactoEmergenciaNombre(dto.getContactoEmergenciaNombre());
		p.setContactoEmergenciaParentesco(Parentesco.normalizar(dto.getContactoEmergenciaParentesco()));
		p.setContactoEmergenciaTelefono(dto.getContactoEmergenciaTelefono());
		p.setAlergias(dto.getAlergias());
		p.setMedicamentos(dto.getMedicamentos());
		p.setObservaciones(dto.getObservaciones());
		return p;
	}

	// Normalización contra los catálogos (punto 4 del plan de acción)
	private String normalizarTipoDocumento(String valor) {
		return TipoDocumento.desde(valor).getCodigo();
	}

	private String normalizarGenero(String valor) {
		return Genero.desde(valor).getCodigo();
	}

	private String validarDocumento(String tipoDocumento, String documento) {
		String tipo = normalizarTipoDocumento(tipoDocumento);
		if (documento == null || documento.trim().isEmpty()) {
			throw new IllegalArgumentException("El número de documento es requerido");
		}
		String doc = documento.trim();
		if (("CC".equals(tipo) || "TI".equals(tipo) || "RC".equals(tipo)) && !doc.matches("\\d+")) {
			throw new IllegalArgumentException("El documento debe contener solo números para " + tipo);
		}
		return doc;
	}
}
