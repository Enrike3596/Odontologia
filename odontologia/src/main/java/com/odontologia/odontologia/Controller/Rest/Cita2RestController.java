package com.odontologia.odontologia.Controller.Rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.odontologia.odontologia.Dto.Cita2Dto;
import com.odontologia.odontologia.Impl.Cita2ServiceImpl;

public class Cita2RestController {
    @Autowired
    private Cita2ServiceImpl cita2Service;

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
    public Cita2Dto crearCita(@RequestBody Cita2Dto citaDto) {
        return cita2Service.crearCita(citaDto);
    }

    // Actualizar cita existente
    @PutMapping("/citas/{id}")
    public Cita2Dto actualizarCita(@PathVariable Long id, @RequestBody Cita2Dto citaDto) {
        return cita2Service.actualizarCita(id, citaDto);
    }

    // Eliminar cita
    @DeleteMapping("/citas/{id}")
    public void eliminarCita(@PathVariable Long id) {
        cita2Service.eliminarCita(id);
    }
    
}
