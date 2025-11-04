package com.odontologia.odontologia.Controller.Rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.odontologia.odontologia.Dto.Paciente2Dto;

public class Paciente2RestController {
    @Autowired  

    private Paciente2RestController paciente2Service;

    // Listar todos los pacientes

    @GetMapping("/pacientes2")
    public List<Paciente2Dto> listarPacientes2() {
        return paciente2Service.listarPacientes2();
    }

    // Obtener paciente por ID
    @GetMapping("/pacientes2/{id}")
    public Paciente2Dto obtenerPaciente2PorId(@PathVariable Long id) {
        return paciente2Service.obtenerPaciente2PorId(id);
    }

    // Crear nuevo paciente
    @PostMapping("/pacientes2")
    public Paciente2Dto crearPaciente2(@RequestBody Paciente2Dto paciente2Dto) {
        return paciente2Service.crearPaciente2(paciente2Dto);
    }

    // Actualizar paciente existente
    @PutMapping("/pacientes2/{id}")
    public Paciente2Dto actualizarPaciente2(@PathVariable Long id, @RequestBody Paciente2Dto paciente2Dto) {
        return paciente2Service.actualizarPaciente2(id, paciente2Dto);
    }

    // Eliminar paciente
    @DeleteMapping("/pacientes2/{id}")
    public void eliminarPaciente2(@PathVariable Long id) {
        paciente2Service.eliminarPaciente2(id);
    }
    
}
