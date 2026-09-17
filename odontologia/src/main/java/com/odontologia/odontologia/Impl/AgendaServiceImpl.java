package com.odontologia.odontologia.Impl;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.AgendaDiaDto;
import com.odontologia.odontologia.Dto.BloqueoAgendaDto;
import com.odontologia.odontologia.Dto.SlotAgendaDto;
import com.odontologia.odontologia.Entity.BloqueoAgenda;
import com.odontologia.odontologia.Entity.Cita2;
import com.odontologia.odontologia.Entity.Odontologo;
import com.odontologia.odontologia.Entity.TipoMovimientoAgenda;
import com.odontologia.odontologia.Repository.BloqueoAgendaRepository;
import com.odontologia.odontologia.Repository.Cita2Repository;
import com.odontologia.odontologia.Repository.OdontologoRepository;
import com.odontologia.odontologia.Service.AgendaService;

@Service
public class AgendaServiceImpl implements AgendaService {

    /**
     * Duración del turno en minutos.
     * PENDIENTE: al finalizar se definirá cuánto dura cada procedimiento
     * odontológico (entonces el turno se derivará de TipoCita.duracion).
     */
    public static final int DURACION_TURNO_MINUTOS = 30;

    private static final DateTimeFormatter HORA_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Autowired
    private OdontologoRepository odontologoRepository;

    @Autowired
    private Cita2Repository citaRepository;

    @Autowired
    private BloqueoAgendaRepository bloqueoRepository;

    @Override
    public List<AgendaDiaDto> agendaMensual(Long odontologoId, int anio, int mes) {
        YearMonth ym = YearMonth.of(anio, mes);
        List<AgendaDiaDto> dias = new ArrayList<>();
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            dias.add(agendaDia(odontologoId, ym.atDay(d)));
        }
        return dias;
    }

    @Override
    public AgendaDiaDto agendaDia(Long odontologoId, LocalDate fecha) {
        Odontologo o = odontologoRepository.findById(odontologoId)
                .orElseThrow(() -> new RuntimeException("Odontólogo no encontrado con ID: " + odontologoId));

        boolean laborable = esDiaLaborable(o.getDiasTrabajo(), fecha.getDayOfWeek());
        List<SlotAgendaDto> turnos = new ArrayList<>();

        // Turnos base del horario del odontólogo
        if (laborable) {
            turnos.addAll(generarTurnos(o.getHoraInicio(), o.getHoraFin()));
        }

        List<BloqueoAgenda> movimientos = bloqueoRepository
                .findByOdontologoIdAndFechaAndActivoTrue(odontologoId, fecha);

        // Aperturas extra: agregan turnos fuera del horario base
        for (BloqueoAgenda m : movimientos) {
            if (m.getTipo() == TipoMovimientoAgenda.APERTURA_EXTRA) {
                for (SlotAgendaDto s : generarTurnos(fmt(m.getHoraInicio()), fmt(m.getHoraFin()))) {
                    if (turnos.stream().noneMatch(t -> t.getHora().equals(s.getHora()))) {
                        turnos.add(s);
                    }
                }
            }
        }
        turnos.sort((a, b) -> a.getHora().compareTo(b.getHora()));

        // Citas del día (solo las que ocupan: no canceladas)
        List<Cita2> citas = citaRepository.findByOdontologoIdAndFecha(odontologoId, fecha).stream()
                .filter(c -> !"CANCELADA".equals(String.valueOf(c.getEstado())))
                .collect(Collectors.toList());
        for (SlotAgendaDto s : turnos) {
            citas.stream()
                    .filter(c -> c.getHora() != null && c.getHora().equals(s.getHora()))
                    .findFirst()
                    .ifPresent(c -> {
                        s.setEstado("OCUPADO");
                        s.setCitaId(c.getId());
                    });
        }

        // Bloqueos: cierran turnos libres (un turno ocupado se mantiene)
        for (BloqueoAgenda m : movimientos) {
            if (m.getTipo() == TipoMovimientoAgenda.BLOQUEO) {
                for (SlotAgendaDto s : turnos) {
                    if ("OCUPADO".equals(s.getEstado())) {
                        continue;
                    }
                    if (cubre(m, s.getHora())) {
                        s.setEstado("BLOQUEADO");
                    }
                }
            }
        }

        return new AgendaDiaDto(fecha, nombreDia(fecha.getDayOfWeek()), laborable || !turnos.isEmpty(), turnos);
    }

    @Override
    public void validarTurnoDisponible(Long odontologoId, LocalDate fecha, LocalTime hora) {
        String motivo = motivoNoDisponible(odontologoId, fecha, hora, null);
        if (motivo != null) {
            throw new RuntimeException(motivo);
        }
    }

    @Override
    public boolean turnoDisponible(Long odontologoId, LocalDate fecha, LocalTime hora, Long excluirCitaId) {
        return motivoNoDisponible(odontologoId, fecha, hora, excluirCitaId) == null;
    }

    /**
     * Devuelve null si el turno está libre; en caso contrario el motivo legible
     * (día no laborable, fuera de horario, ocupado o bloqueado). Centraliza la
     * regla para que crear/editar citas y la agenda usen el mismo criterio.
     */
    private String motivoNoDisponible(Long odontologoId, LocalDate fecha, LocalTime hora, Long excluirCitaId) {
        if (fecha == null || hora == null) {
            return "Se requiere fecha y hora para validar el turno";
        }
        // Normalizar segundos/nanos: el formulario envía HH:mm y la BD TIME puede traer segundos
        LocalTime horaNorm = hora.withSecond(0).withNano(0);
        AgendaDiaDto dia;
        try {
            dia = agendaDia(odontologoId, fecha);
        } catch (RuntimeException e) {
            return e.getMessage();
        }
        if (dia.getTurnos() == null || dia.getTurnos().isEmpty()) {
            return "El odontólogo no labora ese día (" + dia.getDiaSemana() + " " + fecha
                    + "). Revise sus días de trabajo en el módulo de Odontólogos o cree una apertura extra en Agenda Médica";
        }
        SlotAgendaDto slot = dia.getTurnos().stream()
                .filter(s -> s.getHora() != null && s.getHora().withSecond(0).withNano(0).equals(horaNorm))
                .findFirst()
                .orElse(null);
        if (slot == null) {
            String libres = dia.getTurnos().stream()
                    .filter(s -> "LIBRE".equals(s.getEstado()))
                    .map(s -> s.getHora().format(HORA_FMT))
                    .collect(Collectors.joining(", "));
            return "La hora " + horaNorm.format(HORA_FMT) + " está fuera del horario del odontólogo ese día"
                    + (libres.isEmpty() ? " (sin turnos libres)" : ". Turnos libres: " + libres);
        }
        if ("OCUPADO".equals(slot.getEstado())
                && (excluirCitaId == null || !excluirCitaId.equals(slot.getCitaId()))) {
            return "El turno " + horaNorm.format(HORA_FMT) + " del " + fecha + " ya está ocupado por otra cita";
        }
        if ("BLOQUEADO".equals(slot.getEstado())) {
            return "El turno " + horaNorm.format(HORA_FMT) + " del " + fecha + " está bloqueado en la agenda del odontólogo";
        }
        if (!"LIBRE".equals(slot.getEstado())) {
            return "El turno no está disponible en la agenda del odontólogo (cerrado u ocupado)";
        }
        return null;
    }

    @Override
    public List<BloqueoAgendaDto> listarMovimientos(Long odontologoId, LocalDate desde, LocalDate hasta) {
        List<BloqueoAgenda> list;
        if (desde != null && hasta != null) {
            list = bloqueoRepository.findByOdontologoIdAndFechaBetweenAndActivoTrue(odontologoId, desde, hasta);
        } else {
            list = bloqueoRepository.findByOdontologoIdAndActivoTrue(odontologoId);
        }
        return list.stream().map(this::aDto).collect(Collectors.toList());
    }

    @Override
    public BloqueoAgendaDto crearMovimiento(BloqueoAgendaDto dto) {
        if (dto.getOdontologoId() == null) {
            throw new RuntimeException("Se requiere el odontólogo para el movimiento de agenda");
        }
        if (dto.getFecha() == null) {
            throw new RuntimeException("Se requiere la fecha del movimiento de agenda");
        }
        if (dto.getTipo() == null) {
            dto.setTipo(TipoMovimientoAgenda.BLOQUEO);
        }
        if ((dto.getHoraInicio() == null) != (dto.getHoraFin() == null)) {
            throw new RuntimeException("Hora de inicio y fin deben venir juntas o ambas vacías (día completo)");
        }
        if (dto.getHoraInicio() != null && !dto.getHoraInicio().isBefore(dto.getHoraFin())) {
            throw new RuntimeException("La hora de inicio debe ser anterior a la hora de fin");
        }
        Odontologo o = odontologoRepository.findById(dto.getOdontologoId())
                .orElseThrow(() -> new RuntimeException("Odontólogo no encontrado con ID: " + dto.getOdontologoId()));

        BloqueoAgenda m = new BloqueoAgenda();
        m.setOdontologo(o);
        m.setFecha(dto.getFecha());
        m.setHoraInicio(dto.getHoraInicio());
        m.setHoraFin(dto.getHoraFin());
        m.setTipo(dto.getTipo());
        m.setMotivo(dto.getMotivo());
        m.setActivo(true);
        return aDto(bloqueoRepository.save(m));
    }

    @Override
    public void eliminarMovimiento(Long id) {
        BloqueoAgenda m = bloqueoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimiento de agenda no encontrado con ID: " + id));
        // Borrado lógico para conservar el historial de apertura/cierre
        m.setActivo(false);
        bloqueoRepository.save(m);
    }

    // ---------- helpers ----------

    private List<SlotAgendaDto> generarTurnos(String inicioStr, String finStr) {
        List<SlotAgendaDto> slots = new ArrayList<>();
        LocalTime inicio = parseHora(inicioStr);
        LocalTime fin = parseHora(finStr);
        if (inicio == null || fin == null || !inicio.isBefore(fin)) {
            return slots;
        }
        LocalTime t = inicio;
        while (!t.plusMinutes(DURACION_TURNO_MINUTOS).isAfter(fin)) {
            slots.add(new SlotAgendaDto(t, "LIBRE", null));
            t = t.plusMinutes(DURACION_TURNO_MINUTOS);
        }
        return slots;
    }

    private boolean cubre(BloqueoAgenda m, LocalTime turno) {
        if (m.getHoraInicio() == null || m.getHoraFin() == null) {
            return true; // día completo
        }
        LocalTime finTurno = turno.plusMinutes(DURACION_TURNO_MINUTOS);
        return turno.isBefore(m.getHoraFin()) && m.getHoraInicio().isBefore(finTurno);
    }

    private boolean esDiaLaborable(String diasTrabajo, DayOfWeek dow) {
        Set<String> dias = normalizarDias(diasTrabajo);
        if (dias.isEmpty()) {
            return false;
        }
        return dias.contains(nombreDia(dow));
    }

    /**
     * Normaliza "días de trabajo" aceptando los formatos reales en BD y UI:
     * - Rangos: "Lunes-Viernes", "Lunes - Viernes", "lunes a viernes"
     * - Listas: "lunes, miercoles, viernes" / "lunes;mércoles;viernes"
     * - Día único: "lunes"
     * Todo insensible a mayúsculas/tildes/espacios. Expande rangos a días individuales.
     */
    private Set<String> normalizarDias(String diasTrabajo) {
        if (diasTrabajo == null || diasTrabajo.trim().isEmpty()) {
            return new HashSet<>();
        }
        List<String> orden = Arrays.asList(
                "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo");
        Set<String> dias = new HashSet<>();
        // Separar lista por coma o punto y coma
        for (String token : diasTrabajo.split("[,;]")) {
            String t = sinTildes(token.trim().toLowerCase(Locale.ROOT));
            if (t.isEmpty()) {
                continue;
            }
            // Rango con " a " (ej: "lunes a viernes")
            if (t.contains(" a ")) {
                String[] partes = t.split("\\s+a\\s+");
                if (partes.length == 2) {
                    agregarRango(dias, orden, partes[0].trim(), partes[1].trim());
                    continue;
                }
            }
            // Rango con guion (ej: "lunes-viernes", "lunes - viernes")
            if (t.contains("-")) {
                String[] partes = t.split("\\s*-\\s*");
                if (partes.length == 2 && !partes[0].isEmpty() && !partes[1].isEmpty()) {
                    agregarRango(dias, orden, partes[0].trim(), partes[1].trim());
                    continue;
                }
            }
            // Día único (solo se acepta si es un día conocido)
            if (orden.contains(t)) {
                dias.add(t);
            }
        }
        return dias;
    }

    private void agregarRango(Set<String> dias, List<String> orden, String inicio, String fin) {
        int i = orden.indexOf(inicio);
        int f = orden.indexOf(fin);
        if (i < 0 || f < 0) {
            return;
        }
        // Rango normal (lun-vie) o con wrap (sab-mar); se recorre en orden circular
        int idx = i;
        do {
            dias.add(orden.get(idx));
            if (idx == f) {
                break;
            }
            idx = (idx + 1) % orden.size();
        } while (idx != i);
    }

    private String nombreDia(DayOfWeek dow) {
        switch (dow) {
            case MONDAY: return "lunes";
            case TUESDAY: return "martes";
            case WEDNESDAY: return "miercoles";
            case THURSDAY: return "jueves";
            case FRIDAY: return "viernes";
            case SATURDAY: return "sabado";
            case SUNDAY: return "domingo";
            default: return "";
        }
    }

    private String sinTildes(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    private LocalTime parseHora(String h) {
        if (h == null || h.trim().isEmpty()) {
            return null;
        }
        return LocalTime.parse(h.trim(), HORA_FMT);
    }

    private String fmt(LocalTime h) {
        return h == null ? null : h.format(HORA_FMT);
    }

    private BloqueoAgendaDto aDto(BloqueoAgenda m) {
        BloqueoAgendaDto dto = new BloqueoAgendaDto();
        dto.setId(m.getId());
        if (m.getOdontologo() != null) {
            dto.setOdontologoId(m.getOdontologo().getId());
            dto.setOdontologoNombre(m.getOdontologo().getNombre() + " " + m.getOdontologo().getApellido());
        }
        dto.setFecha(m.getFecha());
        dto.setHoraInicio(m.getHoraInicio());
        dto.setHoraFin(m.getHoraFin());
        dto.setTipo(m.getTipo());
        dto.setMotivo(m.getMotivo());
        dto.setActivo(m.getActivo());
        return dto;
    }
}
