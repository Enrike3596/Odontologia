package com.odontologia.odontologia.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.odontologia.odontologia.Dto.Cita2Dto;
import com.odontologia.odontologia.Dto.OdontologoDto;
import com.odontologia.odontologia.Dto.Paciente2Dto;
import com.odontologia.odontologia.Dto.TipoCitaDto;
import com.odontologia.odontologia.Entity.Cita2;
import com.odontologia.odontologia.Enums.EstadoCitaEnum;
import com.odontologia.odontologia.Repository.Cita2Repository;

/**
 * Recordatorios automáticos (punto 2): todos los días a las 07:00 envía
 * el correo de recordatorio de las citas del día siguiente que aún no
 * lo recibieron (recordatorioEnviado=false). Sin credenciales
 * (app.mail.enabled=false) el job no hace nada.
 * Además marca cada minuto como NO_ASISTIDA toda cita
 * PENDIENTE/CONFIRMADA/REPROGRAMADA que ya pasó su fecha/hora + 1 minuto.
 */
@Component
public class RecordatorioScheduler {

    @Autowired
    private Cita2Repository citaRepository;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired
    private Cita2Service cita2Service;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void enviarRecordatoriosDelDiaSiguiente() {
        if (!enabled || emailService == null) {
            return;
        }
        LocalDate manana = LocalDate.now().plusDays(1);
        List<EstadoCitaEnum> estados = Arrays.asList(EstadoCitaEnum.PENDIENTE, EstadoCitaEnum.CONFIRMADA, EstadoCitaEnum.REPROGRAMADA);
        List<Cita2> citas;
        try {
            citas = citaRepository.findByFechaAndEstadoIn(manana, estados);
        } catch (Exception e) {
            System.err.println("[Recordatorios] No se pudieron consultar las citas: " + e.getMessage());
            return;
        }
        for (Cita2 c : citas) {
            try {
                if (Boolean.TRUE.equals(c.getRecordatorioEnviado())) {
                    continue;
                }
                Cita2Dto dto = convertir(c);
                if (dto.getPaciente() == null || dto.getPaciente().getEmail() == null) {
                    continue;
                }
                emailService.enviarRecordatorio(dto);
                c.setRecordatorioEnviado(true);
                citaRepository.save(c);
            } catch (Exception e) {
                System.err.println("[Recordatorios] Fallo con cita " + c.getId() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Barrido AUTOMÁTICO del sistema (única vía a NO_ASISTIDA):
     * cada minuto marca como NO_ASISTIDA toda cita PENDIENTE/CONFIRMADA/REPROGRAMADA
     * que ya pasó su fecha y horario (+ 1 minuto de tolerancia) sin atenderse.
     * Una vez en NO_ASISTIDA la cita es inmutable.
     */
    @Scheduled(cron = "0 * * * * *")
    public void marcarNoAsistidasVencidas() {
        try {
            int marcadas = cita2Service.marcarVencidasComoNoAsistidas();
            if (marcadas > 0) {
                System.out.println("[Citas] Marcadas como no asistidas (vencidas): " + marcadas);
            }
        } catch (Exception e) {
            System.err.println("[Citas] Fallo el barrido de vencidas: " + e.getMessage());
        }
    }

    private Cita2Dto convertir(Cita2 c) {
        Cita2Dto dto = new Cita2Dto();
        dto.setId(c.getId());
        dto.setFecha(c.getFecha());
        dto.setHora(c.getHora());
        dto.setEstado(c.getEstado());
        dto.setObservaciones(c.getObservaciones());
        if (c.getPaciente() != null) {
            Paciente2Dto p = new Paciente2Dto();
            p.setId(c.getPaciente().getId());
            p.setNombres(c.getPaciente().getNombres());
            p.setApellidos(c.getPaciente().getApellidos());
            p.setDocumento(c.getPaciente().getDocumento());
            p.setEmail(c.getPaciente().getEmail());
            p.setTelefono(c.getPaciente().getTelefono());
            dto.setPaciente(p);
        }
        if (c.getOdontologo() != null) {
            OdontologoDto o = new OdontologoDto();
            o.setId(c.getOdontologo().getId());
            o.setNombre(c.getOdontologo().getNombre());
            o.setApellido(c.getOdontologo().getApellido());
            dto.setOdontologo(o);
        }
        if (c.getTipoCita() != null) {
            TipoCitaDto t = new TipoCitaDto();
            t.setId(c.getTipoCita().getId());
            t.setNombre(c.getTipoCita().getNombre());
            dto.setTipoCita(t);
        }
        return dto;
    }
}
