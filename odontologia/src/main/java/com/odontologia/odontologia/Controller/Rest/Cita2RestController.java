package com.odontologia.odontologia.Controller.Rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.odontologia.odontologia.Dto.Cita2Dto;
import com.odontologia.odontologia.Service.Cita2Service;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class Cita2RestController {
    @org.springframework.beans.factory.annotation.Autowired
    private Cita2Service cita2Service;

    // Listar todas las citas

    @GetMapping("/citas")
    public List<Cita2Dto> listarCitas() {
        return cita2Service.listarCitas();
    }

    // Obtener cita por ID
    @GetMapping("/citas/{id}")
    public Cita2Dto obtenerCitaPorId(@PathVariable Long id) {
        return cita2Service.obtenerCitaPorId(id);
    }

    // Crear nueva cita
    @PostMapping("/citas")
    public ResponseEntity<?> crearCita(@RequestBody Cita2Dto citaDto) {
        try {
            return ResponseEntity.ok(cita2Service.crearCita(citaDto));
        } catch (RuntimeException e) {
            // Conflicto de agenda (turno ocupado/cerrado) -> 409 con mensaje legible,
            // para que el frontend lo muestre sin el trace del 500
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Turno no disponible"));
        }
    }

    // Actualizar cita existente
    @PutMapping("/citas/{id}")
    public ResponseEntity<?> actualizarCita(@PathVariable Long id, @RequestBody Cita2Dto citaDto) {
        try {
            return ResponseEntity.ok(cita2Service.actualizarCita(id, citaDto));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "No se pudo actualizar la cita";
            HttpStatus status = msg.contains("no encontrada") || msg.contains("no encontrado")
                    ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
            return ResponseEntity.status(status).body(Map.of("message", msg));
        }
    }

    // Eliminar cita
    @DeleteMapping("/citas/{id}")
    public void eliminarCita(@PathVariable Long id) {
        cita2Service.eliminarCita(id);
    }

    // Confirmar cita: solo el mismo día, antes de la hora (no envía correos)
    @PostMapping("/citas/{id}/confirmar")
    public ResponseEntity<?> confirmarCita(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(cita2Service.confirmarCita(id));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "No se pudo confirmar la cita";
            HttpStatus status = msg.contains("no encontrada")
                    ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
            return ResponseEntity.status(status).body(Map.of("message", msg));
        }
    }

    // Recordatorio de cita por correo: solo un día antes (no cambia el estado)
    @PostMapping("/citas/{id}/recordatorio")
    public ResponseEntity<?> enviarRecordatorio(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(cita2Service.enviarRecordatorio(id));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "No se pudo enviar el recordatorio";
            HttpStatus status = msg.contains("no encontrada")
                    ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
            return ResponseEntity.status(status).body(Map.of("message", msg));
        }
    }
    
}
