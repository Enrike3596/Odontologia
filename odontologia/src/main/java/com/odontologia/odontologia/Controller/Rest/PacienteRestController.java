package com.odontologia.odontologia.Controller.Rest;

import com.odontologia.odontologia.Dto.PacienteDto;
import com.odontologia.odontologia.Service.PacienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = "*") // Permite llamadas desde el frontend
public class PacienteRestController {

    @Autowired
    private PacienteService pacienteService;

    // Obtener todos los pacientes
    @GetMapping
    public List<PacienteDto> listarPacientes() {
        return pacienteService.listarPacientes();
    }

    // Obtener un paciente por ID
    @GetMapping("/{id}")
    public PacienteDto obtenerPaciente(@PathVariable Long id) {
        return pacienteService.obtenerPacientePorId(id);
    }

    // Crear un nuevo paciente
    @PostMapping
    public PacienteDto crearPaciente(@RequestBody PacienteDto pacienteDto) {
        return pacienteService.crearPaciente(pacienteDto);
    }

    // Actualizar un paciente existente
    @PutMapping("/{id}")
    public PacienteDto actualizarPaciente(@PathVariable Long id, @RequestBody PacienteDto pacienteDto) {
        return pacienteService.actualizarPaciente(id, pacienteDto);
    }

    // Eliminar paciente por ID
    @DeleteMapping("/{id}")
    public void eliminarPaciente(@PathVariable Long id) {
        pacienteService.eliminarPaciente(id);
    }
}
