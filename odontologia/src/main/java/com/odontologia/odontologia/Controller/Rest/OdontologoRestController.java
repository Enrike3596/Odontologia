package com.odontologia.odontologia.Controller.Rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.odontologia.odontologia.Dto.OdontologoDto;
import com.odontologia.odontologia.Service.OdontologoService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class OdontologoRestController {
    @Autowired
    private OdontologoService odontologoService;

    // Listar todos los odontólogos
    @GetMapping("/odontologos")
    public List<OdontologoDto> listarOdontologos() {
        return odontologoService.listarOdontologos();
    }

    // Obtener odontólogo por ID
    @GetMapping("/odontologos/{id}")
    public OdontologoDto obtenerOdontologoPorId(@PathVariable Long id) {
        return odontologoService.obtenerOdontologoPorId(id);
    }

    // Odontólogos por especialidad (tipo de cita = especialidad del odontólogo)
    @GetMapping("/odontologos/por-especialidad")
    public List<OdontologoDto> listarPorEspecialidad(
            @org.springframework.web.bind.annotation.RequestParam("especialidad") String especialidad) {
        return odontologoService.listarPorEspecialidad(especialidad);
    }

    // Crear nuevo odontólogo (especialidades contra el enum Especialidad)
    @PostMapping("/odontologos")
    public ResponseEntity<?> crearOdontologo(@RequestBody OdontologoDto odontologoDto) {
        try {
            return ResponseEntity.ok(odontologoService.crearOdontologo(odontologoDto));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "No se pudo crear el odontólogo"));
        }
    }
    // Actualizar odontólogo existente
    @PutMapping("/odontologos/{id}")
    public ResponseEntity<?> actualizarOdontologo(@PathVariable Long id, @RequestBody OdontologoDto odontologoDto) {
        try {
            return ResponseEntity.ok(odontologoService.actualizarOdontologo(id, odontologoDto));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "No se pudo actualizar el odontólogo";
            HttpStatus status = msg.contains("no encontrado")
                    ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
            return ResponseEntity.status(status).body(Map.of("message", msg));
        }
    }

    // Eliminar odontólogo
    @DeleteMapping("/odontologos/{id}")
    public void eliminarOdontologo(@PathVariable Long id) {
        odontologoService.eliminarOdontologo(id);
    }
}
