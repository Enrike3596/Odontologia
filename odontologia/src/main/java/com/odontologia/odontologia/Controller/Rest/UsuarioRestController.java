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
    public ResponseEntity<?> crearUsuario(@RequestBody UsuarioDto usuarioDto) {
        try {
            UsuarioDto usuarioCreado = usuarioService.crearUsuario(usuarioDto);
            return ResponseEntity.ok(usuarioCreado);
        } catch (RuntimeException e) {
            // Log del error para debugging
            System.err.println("Error al crear usuario: " + e.getMessage());
            e.printStackTrace();
            
            // Retornar error con mensaje descriptivo
            return ResponseEntity.badRequest()
                .body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Log del error para debugging
            System.err.println("Error inesperado al crear usuario: " + e.getMessage());
            e.printStackTrace();
            
            // Retornar error genérico
            return ResponseEntity.status(500)
                .body(java.util.Map.of("error", "Error interno del servidor"));
        }
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
    public ResponseEntity<String> cambiarEstadoUsuario(@PathVariable Long id, @RequestBody java.util.Map<String, Boolean> request) {
        try {
            Boolean activo = request.get("activo");
            if (activo == null) {
                return ResponseEntity.badRequest().body("El campo 'activo' es requerido");
            }
            
            UsuarioDto usuario = usuarioService.obtenerUsuarioPorId(id);
            usuario.setActivo(activo);
            usuarioService.actualizarUsuario(id, usuario);
            
            String mensaje = activo ? "Usuario activado exitosamente" : "Usuario desactivado exitosamente";
            return ResponseEntity.ok(mensaje);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}