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

import com.odontologia.odontologia.Dto.OdontologoDto;
import com.odontologia.odontologia.Service.OdontologoService;

@RestController
@RequestMapping("/api")
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

    // Crear nuevo odontólogo
    @PostMapping("/odontologos")
    public OdontologoDto crearOdontologo(@RequestBody OdontologoDto odontologoDto) {
        return odontologoService.crearOdontologo(odontologoDto);
    }
    // Actualizar odontólogo existente
    @PutMapping("/odontologos/{id}")
    public OdontologoDto actualizarOdontologo(@PathVariable Long id, @RequestBody OdontologoDto odontologoDto) {
        return odontologoService.actualizarOdontologo(id, odontologoDto);
    }

    // Eliminar odontólogo
    @DeleteMapping("/odontologos/{id}")
    public void eliminarOdontologo(@PathVariable Long id) {
        odontologoService.eliminarOdontologo(id);
    }
}
