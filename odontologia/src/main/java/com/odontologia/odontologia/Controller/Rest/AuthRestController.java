package com.odontologia.odontologia.Controller.Rest;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.odontologia.odontologia.Dto.LoginRequestDto;
import com.odontologia.odontologia.Dto.UsuarioDto;
import com.odontologia.odontologia.Service.UsuarioService;

@RestController
@RequestMapping("/api/auth")
public class AuthRestController {

    @Autowired
    private UsuarioService usuarioService;

    /**
     * Autentica un usuario contra la base de datos.
     * Acepta email, username o documento como identificador.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto request) {
        if (request == null
                || request.getIdentifier() == null || request.getIdentifier().trim().isEmpty()
                || request.getPassword() == null || request.getPassword().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Identificador y contraseña son requeridos"));
        }

        try {
            UsuarioDto usuario = usuarioService.autenticar(request.getIdentifier(), request.getPassword());
            return ResponseEntity.ok(usuario);
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            // Usuario inactivo -> 403; credenciales invalidas -> 401
            if (msg != null && msg.toLowerCase().contains("inactivo")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", msg));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", msg != null ? msg : "Credenciales inválidas"));
        }
    }
}
