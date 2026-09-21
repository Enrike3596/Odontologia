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

import com.odontologia.odontologia.Dto.TipoCitaDto;
import com.odontologia.odontologia.Service.TipoCitaService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TipoCitaRestController {
    @Autowired
    private TipoCitaService tipoCitaService;

    // Listar todos los tipos de cita
    @GetMapping("/tipos-cita")
    public List<TipoCitaDto> listarTiposCita() {
        return tipoCitaService.listarTipoCitas();
    }

    // Obtener tipo de cita por ID
    @GetMapping("/tipos-cita/{id}")
    public TipoCitaDto obtenerTipoCitaPorId(@PathVariable Long id) {
        return tipoCitaService.obtenerTipoCitaPorId(id);
    }

    // Crear nuevo tipo de cita (el nombre debe pertenecer al enum Especialidad)
    @PostMapping("/tipos-cita")
    public ResponseEntity<?> crearTipoCita(@RequestBody TipoCitaDto tipoCitaDto) {
        try {
            return ResponseEntity.ok(tipoCitaService.crearTipoCita(tipoCitaDto));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "No se pudo crear el tipo de cita"));
        }
    }

    // Actualizar tipo de cita existente (el nombre debe pertenecer al enum Especialidad)
    @PutMapping("/tipos-cita/{id}")
    public ResponseEntity<?> actualizarTipoCita(@PathVariable Long id, @RequestBody TipoCitaDto tipoCitaDto) {
        try {
            return ResponseEntity.ok(tipoCitaService.actualizarTipoCita(id, tipoCitaDto));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "No se pudo actualizar el tipo de cita";
            HttpStatus status = msg.contains("no encontrado")
                    ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
            return ResponseEntity.status(status).body(Map.of("message", msg));
        }
    }

    // Eliminar tipo de cita
    @DeleteMapping("/tipos-cita/{id}")
    public void eliminarTipoCita(@PathVariable Long id) {
        tipoCitaService.eliminarTipoCita(id);
    }
    
}
