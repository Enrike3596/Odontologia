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
import com.odontologia.odontologia.Enums.EstadoCitaEnum;
import com.odontologia.odontologia.Entity.Odontologo;
import com.odontologia.odontologia.Entity.Paciente2;
import com.odontologia.odontologia.Entity.TipoCita;
import com.odontologia.odontologia.Repository.Cita2Repository;
import com.odontologia.odontologia.Repository.OdontologoRepository;
import com.odontologia.odontologia.Repository.Paciente2Repository;
import com.odontologia.odontologia.Repository.TipoCitaRepository;
import com.odontologia.odontologia.Service.AgendaService;
import com.odontologia.odontologia.Service.Cita2Service;
import com.odontologia.odontologia.Service.EmailService;

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

	@Autowired
	private AgendaService agendaService;

	@Autowired(required = false)
	private EmailService emailService;

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
		if (cita.getEstado() == null) {
			cita.setEstado(EstadoCitaEnum.PENDIENTE);
		}
		if (cita.getHora() != null) {
			cita.setHora(cita.getHora().withSecond(0).withNano(0));
		}
		// Validar contra la agenda: turno abierto y sin solape
		agendaService.validarTurnoDisponible(
				cita.getOdontologo().getId(), cita.getFecha(), cita.getHora());
		Cita2 guardada = citaRepository.save(cita);
		Cita2Dto resultado = convertirEntityADto(guardada);
		notificarPorCorreo(resultado, citaDto.getEnviarRecordatorio(), citaDto.getEmailSolicitante());
		return resultado;
	}

	@Override
	public Cita2Dto actualizarCita(Long id, Cita2Dto citaDto) {
		Cita2 existente = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));

		// Resolver nuevos valores (los no enviados conservan los actuales)
		java.time.LocalDate nuevaFecha = citaDto.getFecha() != null ? citaDto.getFecha() : existente.getFecha();
		java.time.LocalTime nuevaHora = citaDto.getHora() != null ? citaDto.getHora() : existente.getHora();
		Long nuevoOdontologoId = existente.getOdontologo().getId();
		if (citaDto.getOdontologo() != null && citaDto.getOdontologo().getId() != null) {
			nuevoOdontologoId = citaDto.getOdontologo().getId();
		}

		// Solo revalidar agenda si cambió el turno (comparación nula-segura)
		boolean cambioTurno = !java.util.Objects.equals(nuevaFecha, existente.getFecha())
				|| (nuevaHora != null && existente.getHora() != null
					&& !nuevaHora.withSecond(0).withNano(0).equals(existente.getHora().withSecond(0).withNano(0)))
				|| (nuevaHora != null && existente.getHora() == null)
				|| !java.util.Objects.equals(nuevoOdontologoId,
					existente.getOdontologo() != null ? existente.getOdontologo().getId() : null);
		if (cambioTurno && !agendaService.turnoDisponible(nuevoOdontologoId, nuevaFecha, nuevaHora, id)) {
			throw new RuntimeException("El turno no está disponible en la agenda del odontólogo (cerrado u ocupado)");
		}

		// Actualizar campos simples (solo si vienen en el DTO: cancelar envía solo estado)
		if (citaDto.getFecha() != null) {
			existente.setFecha(citaDto.getFecha());
		}
		if (citaDto.getHora() != null) {
			existente.setHora(citaDto.getHora().withSecond(0).withNano(0));
		}
		if (citaDto.getEstado() != null) {
			existente.setEstado(citaDto.getEstado());
		}
		if (citaDto.getObservaciones() != null) {
			existente.setObservaciones(citaDto.getObservaciones());
		}

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

	/**
	 * Dispara los correos de confirmación/recordatorio sin romper el flujo:
	 * cualquier fallo de correo solo se registra en log.
	 */
	private void notificarPorCorreo(Cita2Dto guardada, Boolean enviarRecordatorio, String emailSolicitante) {
		if (emailService == null) {
			return;
		}
		try {
			emailService.notificarCitaAgendada(guardada, enviarRecordatorio, emailSolicitante);
		} catch (Exception e) {
			// No interrumpir la creación de la cita por fallos de correo
			System.err.println("[Citas] No se pudo enviar el correo de la cita " + guardada.getId() + ": " + e.getMessage());
		}
	}

	@Override
	public void eliminarCita(Long id) {
		if (!citaRepository.existsById(id)) {
			throw new RuntimeException("Cita no encontrada con ID: " + id);
		}
		citaRepository.deleteById(id);
	}

	@Override
	@org.springframework.transaction.annotation.Transactional
	public Cita2Dto confirmarCita(Long id) {
		Cita2 cita = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
		if (cita.getEstado() == EstadoCitaEnum.CANCELADA
				|| cita.getEstado() == EstadoCitaEnum.COMPLETADA) {
			throw new RuntimeException("Solo se pueden confirmar citas pendientes");
		}
		if (cita.getEstado() == EstadoCitaEnum.CONFIRMADA) {
			return convertirEntityADto(cita);
		}
		// Regla: la confirmación se realiza el mismo día, antes de la hora de la cita
		java.time.LocalDate hoy = java.time.LocalDate.now();
		if (cita.getFecha() == null || !cita.getFecha().equals(hoy)) {
			throw new RuntimeException("La cita solo puede confirmarse el mismo día de la cita (hoy: " + hoy + ")");
		}
		if (cita.getHora() != null
				&& !java.time.LocalTime.now().isBefore(cita.getHora().withSecond(0).withNano(0))) {
			throw new RuntimeException("La cita solo puede confirmarse antes de su hora (" + cita.getHora() + ")");
		}
		cita.setEstado(EstadoCitaEnum.CONFIRMADA);
		cita = citaRepository.save(cita);
		return convertirEntityADto(cita);
	}

	@Override
	@org.springframework.transaction.annotation.Transactional
	public Cita2Dto enviarRecordatorio(Long id) {
		Cita2 cita = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
		if (cita.getEstado() == EstadoCitaEnum.CANCELADA
				|| cita.getEstado() == EstadoCitaEnum.COMPLETADA) {
			throw new RuntimeException("Solo se puede enviar recordatorio de citas pendientes o confirmadas");
		}
		// Regla: el recordatorio solo se realiza un día antes de la cita
		java.time.LocalDate manana = java.time.LocalDate.now().plusDays(1);
		if (cita.getFecha() == null || !cita.getFecha().equals(manana)) {
			throw new RuntimeException("El recordatorio solo puede enviarse un día antes de la cita (mañana: " + manana + ")");
		}
		Cita2Dto resultado = convertirEntityADto(cita);
		try {
			if (emailService != null) {
				emailService.enviarRecordatorio(resultado);
			}
		} catch (Exception e) {
			System.err.println("[Citas] Falló el recordatorio de la cita " + id + ": " + e.getMessage());
		}
		try {
			cita.setRecordatorioEnviado(true);
			cita = citaRepository.save(cita);
			resultado = convertirEntityADto(cita);
		} catch (Exception e) {
			System.err.println("[Citas] No se pudo marcar recordatorio_enviado en cita " + id + ": " + e.getMessage());
		}
		return resultado;
	}

	// Conversión Entity -> DTO
	private Cita2Dto convertirEntityADto(Cita2 cita) {
		Cita2Dto dto = new Cita2Dto();
		dto.setId(cita.getId());
		dto.setFecha(cita.getFecha());
		dto.setHora(cita.getHora());
		dto.setEstado(cita.getEstado());
		dto.setObservaciones(cita.getObservaciones());
		dto.setRecordatorioEnviado(cita.getRecordatorioEnviado());

		if (cita.getPaciente() != null) {
			Paciente2 p = cita.getPaciente();
			Paciente2Dto pdto = new Paciente2Dto();
			pdto.setId(p.getId());
			pdto.setNombres(p.getNombres());
			pdto.setApellidos(p.getApellidos());
			pdto.setDocumento(p.getDocumento());
			pdto.setGenero(p.getGenero());
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
			odto.setEspecialidades(o.getEspecialidades());
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
