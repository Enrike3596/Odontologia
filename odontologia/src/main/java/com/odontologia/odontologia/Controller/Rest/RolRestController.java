package com.odontologia.odontologia.Controller.Rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.odontologia.odontologia.Dto.RolDto;

public class RolRestController {
    @Autowired

    private com.odontologia.odontologia.Impl.RolServiceImpl rolService;

    // Listar todos los roles
    @GetMapping("/roles")
    public List<RolDto> listarRoles() {
        return rolService.listarRoles();
    }

    // Obtener rol por ID
    @GetMapping("/roles/{id}")
    public RolDto obtenerRolPorId(@PathVariable Long id) {
        return rolService.obtenerRolPorId(id);
    }

    // Crear nuevo rol
    @PostMapping("/roles")
    public RolDto crearRol(@RequestBody RolDto rolDto) {
        return rolService.crearRol(rolDto);
    }

    // Actualizar rol existente
    @PutMapping("/roles/{id}")
    public RolDto actualizarRol(@PathVariable Long id, @RequestBody RolDto rolDto) {
        return rolService.actualizarRol(id, rolDto);
    }

    // Eliminar rol
    @DeleteMapping("/roles/{id}")
    public void eliminarRol(@PathVariable Long id) {
        rolService.eliminarRol(id);
    }
    
}
