package com.odontologia.odontologia.Impl;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.odontologia.odontologia.Dto.Cita2Dto;
import com.odontologia.odontologia.Service.EmailService;

import jakarta.mail.internet.MimeMessage;

/**
 * Correos vía Gmail SMTP (punto 2). Solo actúa si app.mail.enabled=true;
 * caso contrario registra en log y no hace nada (la app funciona sin
 * credenciales). Cada envío se aísla en try/catch: un fallo de correo
 * jamás interrumpe la creación de la cita.
 */
@Service
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private TemplateEngine templateEngine;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:citas@clinica.local}")
    private String from;

    @Override
    @Async
    public void notificarCitaAgendada(Cita2Dto cita, Boolean enviarRecordatorio, String emailSolicitante) {
        boolean optIn = enviarRecordatorio == null || Boolean.TRUE.equals(enviarRecordatorio);
        if (!optIn) {
            return;
        }
        // 1) Confirmación al paciente
        String emailPaciente = cita.getPaciente() != null ? cita.getPaciente().getEmail() : null;
        if (esEmailValido(emailPaciente)) {
            enviarSeguro(emailPaciente.trim(), "Confirmación de cita odontológica",
                    "email/confirmacion-cita", contextoCita(cita));
        }
        // 2) Copia informativa al usuario que agenda (para no olvidar la cita)
        if (esEmailValido(emailSolicitante)
                && (emailPaciente == null || !emailSolicitante.trim().equalsIgnoreCase(emailPaciente.trim()))) {
            enviarSeguro(emailSolicitante.trim(), "Cita asignada: " + nombrePaciente(cita),
                    "email/recordatorio-cita", contextoCita(cita));
        }
    }

    @Override
    @Async
    public void enviarRecordatorio(Cita2Dto cita) {
        String emailPaciente = cita.getPaciente() != null ? cita.getPaciente().getEmail() : null;
        if (!esEmailValido(emailPaciente)) {
            return;
        }
        enviarSeguro(emailPaciente.trim(), "Recordatorio de cita odontológica",
                "email/recordatorio-cita", contextoCita(cita));
    }

    // ---------- internos ----------

    private Context contextoCita(Cita2Dto cita) {
        Context ctx = new Context();
        ctx.setVariable("paciente", nombrePaciente(cita));
        ctx.setVariable("documento", cita.getPaciente() != null ? cita.getPaciente().getDocumento() : null);
        ctx.setVariable("fecha", cita.getFecha() != null ? cita.getFecha().toString() : null);
        ctx.setVariable("hora", cita.getHora() != null ? cita.getHora().toString() : null);
        ctx.setVariable("tipoCita", cita.getTipoCita() != null ? cita.getTipoCita().getNombre() : "Consulta General");
        String odontologo = "Por asignar";
        if (cita.getOdontologo() != null) {
            odontologo = "Dr. " + cita.getOdontologo().getNombre() + " " + cita.getOdontologo().getApellido();
        }
        ctx.setVariable("odontologo", odontologo);
        ctx.setVariable("motivo", cita.getObservaciones());
        ctx.setVariable("folio", "CITA-" + cita.getId());
        return ctx;
    }

    private String nombrePaciente(Cita2Dto cita) {
        if (cita.getPaciente() == null) {
            return "Paciente";
        }
        String n = (cita.getPaciente().getNombres() != null ? cita.getPaciente().getNombres() : "")
                + " " + (cita.getPaciente().getApellidos() != null ? cita.getPaciente().getApellidos() : "");
        return n.trim().isEmpty() ? "Paciente" : n.trim();
    }

    private boolean esEmailValido(String email) {
        return email != null && email.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    }

    private void enviarSeguro(String destino, String asunto, String plantilla, Context ctx) {
        if (!enabled) {
            System.out.println("[Email] Envío desactivado (app.mail.enabled=false). Destino pendiente: " + destino);
            return;
        }
        if (mailSender == null || templateEngine == null) {
            System.err.println("[Email] Infraestructura de correo no disponible. Destino pendiente: " + destino);
            return;
        }
        try {
            String html = templateEngine.process(plantilla, ctx);
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(destino);
            helper.setSubject(asunto);
            helper.setText(html, true);
            mailSender.send(msg);
            System.out.println("[Email] Correo enviado a " + destino + " [" + asunto + "]");
        } catch (Exception e) {
            System.err.println("[Email] Fallo al enviar a " + destino + ": " + e.getMessage());
        }
    }
}
