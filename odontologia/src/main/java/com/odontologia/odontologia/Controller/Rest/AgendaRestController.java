package com.odontologia.odontologia.Controller.Rest;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.odontologia.odontologia.Dto.AgendaDiaDto;
import com.odontologia.odontologia.Dto.BloqueoAgendaDto;
import com.odontologia.odontologia.Service.AgendaService;

/**
 * Agenda mensual del odontólogo + apertura/cierre (punto 1).
 * La gestión (POST/DELETE) está reservada al rol Administrador
 * (guard en frontend + regla documentada; sin Spring Security).
 */
@RestController
@RequestMapping("/api/agenda")
public class AgendaRestController {

    @Autowired
    private AgendaService agendaService;

    /** Matriz del mes: ?odontologoId=1&anio=2026&mes=9 */
    @GetMapping
    public List<AgendaDiaDto> agendaMensual(
            @RequestParam Long odontologoId,
            @RequestParam int anio,
            @RequestParam int mes) {
        return agendaService.agendaMensual(odontologoId, anio, mes);
    }

    /** Agenda de un día: /api/agenda/dia?odontologoId=1&fecha=2026-09-20 */
    @GetMapping("/dia")
    public AgendaDiaDto agendaDia(
            @RequestParam Long odontologoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return agendaService.agendaDia(odontologoId, fecha);
    }

    /** Movimientos (bloqueos/aperturas) con filtro opcional por rango. */
    @GetMapping("/movimientos")
    public List<BloqueoAgendaDto> movimientos(
            @RequestParam Long odontologoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return agendaService.listarMovimientos(odontologoId, desde, hasta);
    }

    /** Apertura/cierre: {odontologoId, fecha, horaInicio?, horaFin?, tipo, motivo} */
    @PostMapping("/movimientos")
    public BloqueoAgendaDto crearMovimiento(@RequestBody BloqueoAgendaDto dto) {
        return agendaService.crearMovimiento(dto);
    }

    @DeleteMapping("/movimientos/{id}")
    public void eliminarMovimiento(@PathVariable Long id) {
        agendaService.eliminarMovimiento(id);
    }
}
