package com.odontologia.odontologia.Controller.Rest;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.odontologia.odontologia.Config.AuthPrincipal;
import com.odontologia.odontologia.Config.LoginAttemptService;
import com.odontologia.odontologia.Dto.LoginRequestDto;
import com.odontologia.odontologia.Dto.UsuarioDto;
import com.odontologia.odontologia.Service.UsuarioService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthRestController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private LoginAttemptService loginAttemptService;

    private final HttpSessionSecurityContextRepository contextRepository =
            new HttpSessionSecurityContextRepository();

    /**
     * Autentica un usuario contra la base de datos (hash BCrypt).
     * Acepta email, username o documento como identificador.
     * En éxito crea la sesión HTTP del lado servidor; el frontend conserva
     * solo una caché de UI (nunca es prueba de acceso).
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto request,
            HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (request == null
                || request.getIdentifier() == null || request.getIdentifier().trim().isEmpty()
                || request.getPassword() == null || request.getPassword().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Identificador y contraseña son requeridos"));
        }

        String identifier = request.getIdentifier().trim();
        String ip = httpRequest.getRemoteAddr();
        long bloqueo = loginAttemptService.bloqueoRestanteSeg(identifier, ip);
        if (bloqueo > 0) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Demasiados intentos. Intente de nuevo en " + (bloqueo / 60 + 1) + " minutos.",
                    "reintentoEnSegundos", bloqueo));
        }

        try {
            UsuarioDto usuario = usuarioService.autenticar(identifier, request.getPassword());
            loginAttemptService.registrarExito(identifier, ip);

            // Sesión servidor: principal mínimo + authority según rol de BD
            String rolNombre = usuario.getRol() != null ? usuario.getRol().getNombre() : null;
            AuthPrincipal principal = new AuthPrincipal(usuario.getId(), usuario.getUsername(), rolNombre);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    principal, null,
                    List.of(new SimpleGrantedAuthority(principal.authority())));
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
            HttpSession session = httpRequest.getSession(true);
            contextRepository.saveContext(context, httpRequest, httpResponse);
            session.setAttribute("clinica.usuarioId", usuario.getId());

            return ResponseEntity.ok(usuario);
        } catch (RuntimeException e) {
            loginAttemptService.registrarFallo(identifier, ip);
            String msg = e.getMessage();
            // Usuario inactivo -> 403; credenciales invalidas -> 401
            // (mensaje genérico para no revelar si el identificador existe)
            if (msg != null && msg.toLowerCase().contains("inactivo")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", msg));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciales inválidas"));
        }
    }

    /**
     * Usuario de la sesión actual (fuente de verdad para el guardia del
     * frontend). 401 si no hay sesión válida en el servidor.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || !(auth.getPrincipal() instanceof AuthPrincipal principal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Sin sesión"));
        }
        try {
            return ResponseEntity.ok(usuarioService.obtenerUsuarioPorId(principal.id()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Sin sesión"));
        }
    }

    /** Cierra la sesión del servidor e invalida la sesión HTTP. */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest httpRequest) {
        SecurityContextHolder.clearContext();
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /**
     * Solicita un código de recuperación al correo del usuario.
     * Respuesta siempre genérica (no revela si el identificador existe).
     */
    @PostMapping("/recovery")
    public ResponseEntity<?> solicitarRecuperacion(@RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {
        String identifier = body != null ? body.get("identifier") : null;
        if (identifier == null || identifier.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El identificador es requerido"));
        }
        String ip = httpRequest.getRemoteAddr();
        long bloqueo = loginAttemptService.bloqueoRestanteSeg("recovery|" + ip, ip);
        if (bloqueo > 0) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Demasiados intentos. Intente de nuevo en unos minutos."));
        }
        try {
            usuarioService.solicitarRecuperacion(identifier.trim());
        } catch (RuntimeException e) {
            loginAttemptService.registrarFallo("recovery|" + ip, ip);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        return ResponseEntity.ok(Map.of("message",
                "Si existe una cuenta asociada, se envió un código de 6 dígitos a su correo (vigente 15 minutos)."));
    }

    /** Canjea el código de recuperación por una contraseña nueva. */
    @PostMapping("/reset")
    public ResponseEntity<?> restablecerPassword(@RequestBody Map<String, String> body) {
        String codigo = body != null ? body.get("codigo") : null;
        String nuevaPassword = body != null ? body.get("nuevaPassword") : null;
        if (codigo == null || codigo.trim().isEmpty()
                || nuevaPassword == null || nuevaPassword.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El código y la contraseña nueva son requeridos"));
        }
        try {
            usuarioService.restablecerPassword(codigo.trim(), nuevaPassword);
            return ResponseEntity.ok(Map.of("message",
                    "Contraseña restablecida. Ya puede iniciar sesión."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "No se pudo restablecer"));
        }
    }
}
