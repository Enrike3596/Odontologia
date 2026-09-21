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
		// Regla: toda cita nace en PENDIENTE (se ignora cualquier estado enviado)
		cita.setEstado(EstadoCitaEnum.PENDIENTE);
		if (cita.getHora() != null) {
			cita.setHora(cita.getHora().withSecond(0).withNano(0));
		}
		// Validar contra la agenda: turno abierto y sin solape
		agendaService.validarTurnoDisponible(
				cita.getOdontologo().getId(), cita.getFecha(), cita.getHora());
		Cita2 guardada = citaRepository.save(cita);
		Cita2Dto resultado = convertirEntityADto(guardada);
		notificarPorCorreo(resultado, citaDto.getEnviarRecordatorio());
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
		// Regla: no se puede reprogramar hacia una fecha/hora pasada
		if (cambioTurno && nuevaFecha != null && nuevaHora != null) {
			java.time.LocalDateTime nuevoTurno = java.time.LocalDateTime.of(nuevaFecha,
					nuevaHora.withSecond(0).withNano(0));
			if (!nuevoTurno.isAfter(java.time.LocalDateTime.now())) {
				throw new RuntimeException("No se puede reprogramar a una fecha/hora pasada (" + nuevaFecha + " " + nuevaHora + ")");
			}
		}
		// Regla: estados terminales no admiten cambios de turno ni reactivación
		if (existente.getEstado() != null && existente.getEstado().esTerminal()
				&& (cambioTurno || (citaDto.getEstado() != null && citaDto.getEstado() != existente.getEstado()))) {
			throw new RuntimeException("No se puede modificar una cita en estado " + existente.getEstado() + " (terminal)");
		}

		// Actualizar campos simples (solo si vienen en el DTO: cancelar envía solo estado)
		if (citaDto.getFecha() != null) {
			existente.setFecha(citaDto.getFecha());
		}
		if (citaDto.getHora() != null) {
			existente.setHora(citaDto.getHora().withSecond(0).withNano(0));
		}
		if (citaDto.getEstado() != null) {
			// FINALIZADA y NO_ASISTIDA solo vía endpoints dedicados (validan fecha/hora)
			if (citaDto.getEstado() == EstadoCitaEnum.FINALIZADA
					|| citaDto.getEstado() == EstadoCitaEnum.NO_ASISTIDA) {
				throw new RuntimeException("El estado " + citaDto.getEstado() + " solo puede asignarse desde su acción dedicada");
			}
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

		// Regla: cambiar fecha/hora/odontólogo reprograma automáticamente la cita
		// y reinicia el control de recordatorio (la nueva fecha necesita su aviso)
		if (cambioTurno) {
			existente.setEstado(EstadoCitaEnum.REPROGRAMADA);
			existente.setRecordatorioEnviado(false);
		}

		Cita2 actualizada = citaRepository.save(existente);
		return convertirEntityADto(actualizada);
	}

	/**
	 * Dispara el correo de confirmación al paciente sin romper el flujo:
	 * cualquier fallo de correo solo se registra en log.
	 */
	private void notificarPorCorreo(Cita2Dto guardada, Boolean enviarRecordatorio) {
		if (emailService == null) {
			return;
		}
		try {
			emailService.notificarCitaAgendada(guardada, enviarRecordatorio);
		} catch (Exception e) {
			// No interrumpir la creación de la cita por fallos de correo
			System.err.println("[Citas] No se pudo enviar el correo de la cita " + guardada.getId() + ": " + e.getMessage());
		}
	}

	@Override
	public void eliminarCita(Long id) {
		Cita2 cita = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
		// Regla: NO_ASISTIDA es inmutable, ni siquiera se puede eliminar
		if (cita.getEstado() == EstadoCitaEnum.NO_ASISTIDA) {
			throw new RuntimeException("No se puede eliminar una cita no asistida (estado terminal e inmutable)");
		}
		citaRepository.deleteById(id);
	}

	@Override
	@org.springframework.transaction.annotation.Transactional
	public Cita2Dto confirmarCita(Long id) {
		Cita2 cita = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
		// Regla: vencida y sin confirmar -> pasa automáticamente a NO_ASISTIDA
		if (estaVencida(cita) && cita.getEstado() != EstadoCitaEnum.CONFIRMADA) {
			cita.setEstado(EstadoCitaEnum.NO_ASISTIDA);
			citaRepository.save(cita);
			throw new RuntimeException("La cita ya pasó su fecha y horario sin confirmarse: se marcó como no asistida");
		}
		if (cita.getEstado() != null && cita.getEstado().esTerminal()) {
			throw new RuntimeException("Solo se pueden confirmar citas pendientes o reprogramadas (actual: " + cita.getEstado() + ")");
		}
		if (cita.getEstado() == EstadoCitaEnum.CONFIRMADA) {
			return convertirEntityADto(cita);
		}
		if (cita.getEstado() != null && !cita.getEstado().esConfirmable()) {
			throw new RuntimeException("Solo se pueden confirmar citas pendientes o reprogramadas (actual: " + cita.getEstado() + ")");
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
	public Cita2Dto finalizarCita(Long id, Long odontologoId) {
		Cita2 cita = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
		if (cita.getEstado() == EstadoCitaEnum.FINALIZADA) {
			return convertirEntityADto(cita);
		}
		if (cita.getEstado() != EstadoCitaEnum.CONFIRMADA) {
			throw new RuntimeException("Solo se pueden finalizar citas confirmadas y ya atendidas (actual: " + cita.getEstado() + ")");
		}
		// Regla: la finalización la realiza el odontólogo asignado a la cita
		Long asignadoId = cita.getOdontologo() != null ? cita.getOdontologo().getId() : null;
		if (odontologoId != null && !odontologoId.equals(asignadoId)) {
			throw new RuntimeException("Solo el odontólogo asignado puede dar por finalizada la cita (asignado: " + asignadoId + ")");
		}
		if (odontologoId == null && asignadoId == null) {
			throw new RuntimeException("La cita no tiene odontólogo asignado para finalizarla");
		}
		// Regla: la finalización ocurre después de ser atendido (fecha/hora ya pasadas)
		java.time.LocalDate hoy = java.time.LocalDate.now();
		java.time.LocalTime ahora = java.time.LocalTime.now();
		if (cita.getFecha() == null || cita.getFecha().isAfter(hoy)) {
			throw new RuntimeException("La cita solo puede finalizarse después de la atención (fecha: " + cita.getFecha() + ")");
		}
		if (cita.getFecha().equals(hoy) && cita.getHora() != null
				&& ahora.isBefore(cita.getHora().withSecond(0).withNano(0))) {
			throw new RuntimeException("La cita solo puede finalizarse después de su hora (" + cita.getHora() + ")");
		}
		cita.setEstado(EstadoCitaEnum.FINALIZADA);
		// Auditoría: quién la finalizó (sin cambiar el esquema, queda en observaciones)
		try {
			Odontologo profesional = cita.getOdontologo();
			String firma = (profesional != null)
					? profesional.getNombre() + " " + profesional.getApellido() + " (id " + profesional.getId() + ")"
					: ("id " + odontologoId);
			String marca = "[Finalizada por Odont. " + firma + " el " + java.time.LocalDateTime.now().withSecond(0).withNano(0) + "]";
			if (cita.getObservaciones() == null || !cita.getObservaciones().contains("[Finalizada por Odont.")) {
				cita.setObservaciones((cita.getObservaciones() == null || cita.getObservaciones().isBlank())
						? marca : cita.getObservaciones() + " " + marca);
			}
		} catch (Exception e) {
			System.err.println("[Citas] No se pudo auditar la finalización de la cita " + id + ": " + e.getMessage());
		}
		cita = citaRepository.save(cita);
		return convertirEntityADto(cita);
	}

	@Override
	@org.springframework.transaction.annotation.Transactional
	public int marcarVencidasComoNoAsistidas() {
		List<EstadoCitaEnum> activos = List.of(
				EstadoCitaEnum.PENDIENTE, EstadoCitaEnum.CONFIRMADA, EstadoCitaEnum.REPROGRAMADA);
		List<Cita2> candidatas;
		try {
			candidatas = citaRepository.findByEstadoIn(activos);
		} catch (Exception e) {
			System.err.println("[Citas] No se pudieron consultar vencidas: " + e.getMessage());
			return 0;
		}
		int marcadas = 0;
		for (Cita2 c : candidatas) {
			try {
				if (!estaVencida(c)) {
					continue;
				}
				c.setEstado(EstadoCitaEnum.NO_ASISTIDA);
				citaRepository.save(c);
				marcadas++;
			} catch (Exception e) {
				System.err.println("[Citas] Fallo al marcar no asistida la cita " + c.getId() + ": " + e.getMessage());
			}
		}
		return marcadas;
	}

	/**
	 * Vencida = ya pasó 1 minuto desde la fecha/hora asignada.
	 * Sin fecha/hora no se considera vencida (el llamador valida).
	 */
	private static boolean estaVencida(Cita2 cita) {
		if (cita == null || cita.getFecha() == null || cita.getHora() == null) {
			return false;
		}
		java.time.LocalDateTime finTolerancia = java.time.LocalDateTime.of(cita.getFecha(),
				cita.getHora().withSecond(0).withNano(0)).plusMinutes(1);
		return !java.time.LocalDateTime.now().isBefore(finTolerancia);
	}

	@Override
	@org.springframework.transaction.annotation.Transactional
	public Cita2Dto enviarRecordatorio(Long id) {
		Cita2 cita = citaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));
		if (cita.getEstado() == null || !cita.getEstado().admiteRecordatorio()) {
			throw new RuntimeException("Solo se puede enviar recordatorio de citas pendientes, confirmadas o reprogramadas (actual: " + cita.getEstado() + ")");
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
