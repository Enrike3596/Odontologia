package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.Cita2Dto;
import com.odontologia.odontologia.Dto.OdontologoDto;
import com.odontologia.odontologia.Dto.Paciente2Dto;
import com.odontologia.odontologia.Dto.TipoCitaDto;
import com.odontologia.odontologia.Entity.Cita2;
import com.odontologia.odontologia.Entity.Odontologo;
import com.odontologia.odontologia.Entity.Paciente2;
import com.odontologia.odontologia.Entity.TipoCita;
import com.odontologia.odontologia.Repository.Cita2Repository;
import com.odontologia.odontologia.Repository.OdontologoRepository;
import com.odontologia.odontologia.Repository.Paciente2Repository;
import com.odontologia.odontologia.Repository.TipoCitaRepository;
import com.odontologia.odontologia.Service.Cita2Service;

@Service
public class Cita2ServiceImpl implements Cita2Service{

	@Autowired
	private Cita2Repository citaRepository;

	@Autowired
	private Paciente2Repository pacienteRepository;

	@Autowired
	private OdontologoRepository odontologoRepository;

	@Autowired
	private TipoCitaRepository tipoCitaRepository;

	@Override
	public List<Cita2Dto> listarCitas() {
		List<Cita2> citas = citaRepository.findAll();
		return citas.stream()
				.map(this::convertirEntityADto)
				.collect(Collectors.toList());
	}

	@Override
	public Cita2Dto obtenerCitaPorId(Long id) {
		Cita2 cita = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
		return convertirEntityADto(cita);
	}

	@Override
	public Cita2Dto crearCita(Cita2Dto citaDto) {
		Cita2 cita = convertirDtoAEntity(citaDto);
		Cita2 guardada = citaRepository.save(cita);
		return convertirEntityADto(guardada);
	}

	@Override
	public Cita2Dto actualizarCita(Long id, Cita2Dto citaDto) {
		Cita2 existente = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));

		// Actualizar campos simples
		existente.setFecha(citaDto.getFecha());
		existente.setHora(citaDto.getHora());
		existente.setEstado(citaDto.getEstado());
		existente.setObservaciones(citaDto.getObservaciones());

		// Actualizar relaciones si vienen en el DTO
		if (citaDto.getPaciente() != null && citaDto.getPaciente().getId() != null) {
			Paciente2 paciente = pacienteRepository.findById(citaDto.getPaciente().getId())
					.orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + citaDto.getPaciente().getId()));
			existente.setPaciente(paciente);
		}

		if (citaDto.getOdontologo() != null && citaDto.getOdontologo().getId() != null) {
			Odontologo odontologo = odontologoRepository.findById(citaDto.getOdontologo().getId())
					.orElseThrow(() -> new RuntimeException("Odontólogo no encontrado con ID: " + citaDto.getOdontologo().getId()));
			existente.setOdontologo(odontologo);
		}

		if (citaDto.getTipoCita() != null && citaDto.getTipoCita().getId() != null) {
			TipoCita tipo = tipoCitaRepository.findById(citaDto.getTipoCita().getId())
					.orElseThrow(() -> new RuntimeException("Tipo de cita no encontrado con ID: " + citaDto.getTipoCita().getId()));
			existente.setTipoCita(tipo);
		}

		Cita2 actualizada = citaRepository.save(existente);
		return convertirEntityADto(actualizada);
	}

	@Override
	public void eliminarCita(Long id) {
		if (!citaRepository.existsById(id)) {
			throw new RuntimeException("Cita no encontrada con ID: " + id);
		}
		citaRepository.deleteById(id);
	}

	// Conversión Entity -> DTO
	private Cita2Dto convertirEntityADto(Cita2 cita) {
		Cita2Dto dto = new Cita2Dto();
		dto.setId(cita.getId());
		dto.setFecha(cita.getFecha());
		dto.setHora(cita.getHora());
		dto.setEstado(cita.getEstado());
		dto.setObservaciones(cita.getObservaciones());

		if (cita.getPaciente() != null) {
			Paciente2 p = cita.getPaciente();
			Paciente2Dto pdto = new Paciente2Dto();
			pdto.setId(p.getId());
			pdto.setNombre(p.getNombre());
			pdto.setApellido(p.getApellido());
			pdto.setEmail(p.getEmail());
			pdto.setTelefono(p.getTelefono());
			dto.setPaciente(pdto);
		}

		if (cita.getOdontologo() != null) {
			Odontologo o = cita.getOdontologo();
			OdontologoDto odto = new OdontologoDto();
			odto.setId(o.getId());
			odto.setNombre(o.getNombre());
			odto.setApellido(o.getApellido());
			odto.setMatricula(o.getMatricula());
			dto.setOdontologo(odto);
		}

		if (cita.getTipoCita() != null) {
			TipoCita t = cita.getTipoCita();
			TipoCitaDto tdto = new TipoCitaDto();
			tdto.setId(t.getId());
			tdto.setNombre(t.getNombre());
			tdto.setDescripcion(t.getDescripcion());
			dto.setTipoCita(tdto);
		}

		return dto;
	}

	// Conversión DTO -> Entity (resuelve relaciones por id)
	private Cita2 convertirDtoAEntity(Cita2Dto dto) {
		Cita2 cita = new Cita2();
		cita.setFecha(dto.getFecha());
		cita.setHora(dto.getHora());
		cita.setEstado(dto.getEstado());
		cita.setObservaciones(dto.getObservaciones());

		if (dto.getPaciente() != null && dto.getPaciente().getId() != null) {
			Paciente2 paciente = pacienteRepository.findById(dto.getPaciente().getId())
					.orElseThrow(() -> new RuntimeException("Paciente no encontrado con ID: " + dto.getPaciente().getId()));
			cita.setPaciente(paciente);
		} else {
			throw new RuntimeException("Se requiere el paciente (id) para crear la cita");
		}

		if (dto.getOdontologo() != null && dto.getOdontologo().getId() != null) {
			Odontologo odontologo = odontologoRepository.findById(dto.getOdontologo().getId())
					.orElseThrow(() -> new RuntimeException("Odontólogo no encontrado con ID: " + dto.getOdontologo().getId()));
			cita.setOdontologo(odontologo);
		} else {
			throw new RuntimeException("Se requiere el odontólogo (id) para crear la cita");
		}

		if (dto.getTipoCita() != null && dto.getTipoCita().getId() != null) {
			TipoCita tipo = tipoCitaRepository.findById(dto.getTipoCita().getId())
					.orElseThrow(() -> new RuntimeException("Tipo de cita no encontrado con ID: " + dto.getTipoCita().getId()));
			cita.setTipoCita(tipo);
		} else {
			throw new RuntimeException("Se requiere el tipo de cita (id) para crear la cita");
		}

		return cita;
	}
}
