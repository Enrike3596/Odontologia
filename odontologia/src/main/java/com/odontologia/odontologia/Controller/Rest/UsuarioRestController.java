package com.odontologia.odontologia.Controller.Rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.odontologia.odontologia.Dto.UsuarioDto;
import com.odontologia.odontologia.Service.UsuarioService;

@RestController
@RequestMapping("/api")
public class UsuarioRestController {
    @Autowired
    private UsuarioService usuarioService;

    // Listar todos los usuarios
    @GetMapping("/usuarios")
    public List<UsuarioDto> listarUsuarios() {
        return usuarioService.listarUsuarios();
    }

    // Obtener usuario por ID
    @GetMapping("/usuarios/{id}")
    public UsuarioDto obtenerUsuarioPorId(@PathVariable Long id) {
        return usuarioService.obtenerUsuarioPorId(id);
    }

    // Crear nuevo usuario
    @PostMapping("/usuarios")
    public UsuarioDto crearUsuario(@RequestBody UsuarioDto usuarioDto) {
        return usuarioService.crearUsuario(usuarioDto);
    }

    // Actualizar usuario existente
    @PutMapping("/usuarios/{id}")
    public UsuarioDto actualizarUsuario(@PathVariable Long id, @RequestBody UsuarioDto usuarioDto) {
        return usuarioService.actualizarUsuario(id, usuarioDto);
    }

    // Eliminar usuario
    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoint adicional para cambiar estado del usuario (activo/inactivo)
    @PutMapping("/usuarios/{id}/estado")
    public ResponseEntity<UsuarioDto> cambiarEstadoUsuario(@PathVariable Long id, @RequestBody Boolean activo) {
        try {
            UsuarioDto usuario = usuarioService.obtenerUsuarioPorId(id);
            usuario.setActivo(activo);
            UsuarioDto usuarioActualizado = usuarioService.actualizarUsuario(id, usuario);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}