package com.odontologia.odontologia.Controller.Rest;

import com.odontologia.odontologia.Dto.CitaDto;
import com.odontologia.odontologia.Service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "*") // Permite peticiones desde tu frontend
public class CitaRestController {

    @Autowired
    private CitaService citaService;

    // Listar todas las citas
    @GetMapping
    public List<CitaDto> listarCitas() {
        return citaService.listarCitas();
    }

    // Obtener cita por ID
    @GetMapping("/{id}")
    public CitaDto obtenerCitaPorId(@PathVariable Long id) {
        return citaService.obtenerCitaPorId(id);
    }

    // Crear nueva cita
    @PostMapping
    public CitaDto crearCita(@RequestBody CitaDto citaDto) {
        return citaService.crearCita(citaDto);
    }

    // Actualizar cita existente
    @PutMapping("/{id}")
    public CitaDto actualizarCita(@PathVariable Long id, @RequestBody CitaDto citaDto) {
        return citaService.actualizarCita(id, citaDto);
    }

    // Eliminar cita
    @DeleteMapping("/{id}")
    public void eliminarCita(@PathVariable Long id) {
        citaService.eliminarCita(id);
    }
}
