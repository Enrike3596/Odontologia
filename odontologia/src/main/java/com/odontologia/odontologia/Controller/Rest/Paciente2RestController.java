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

import com.odontologia.odontologia.Dto.Paciente2Dto;
import com.odontologia.odontologia.Service.Paciente2Service;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class Paciente2RestController {
    @Autowired  
    private Paciente2Service paciente2Service;

    // Listar todos los pacientes
    @GetMapping("/pacientes")
    public List<Paciente2Dto> listarPacientes2() {
        return paciente2Service.listarPacientes();
    }

    // Obtener paciente por ID
    @GetMapping("/pacientes/{id}")
    public Paciente2Dto obtenerPaciente2PorId(@PathVariable Long id) {
        return paciente2Service.obtenerPacientePorId(id);
    }

    // Crear nuevo paciente
    @PostMapping("/pacientes")
    public Paciente2Dto crearPaciente2(@RequestBody Paciente2Dto paciente2Dto) {
        return paciente2Service.crearPaciente(paciente2Dto);
    }

    // Actualizar paciente existente
    @PutMapping("/pacientes/{id}")
    public Paciente2Dto actualizarPaciente2(@PathVariable Long id, @RequestBody Paciente2Dto paciente2Dto) {
        return paciente2Service.actualizarPaciente(id, paciente2Dto);
    }

    // Eliminar paciente
    @DeleteMapping("/pacientes/{id}")
    public void eliminarPaciente2(@PathVariable Long id) {
        paciente2Service.eliminarPaciente(id);
    }
    
}
