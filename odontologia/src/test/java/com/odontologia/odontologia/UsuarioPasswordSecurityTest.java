package com.odontologia.odontologia;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.odontologia.odontologia.Dto.UsuarioDto;
import com.odontologia.odontologia.Entity.PasswordResetToken;
import com.odontologia.odontologia.Entity.Rol;
import com.odontologia.odontologia.Entity.Usuario;
import com.odontologia.odontologia.Impl.UsuarioServiceImpl;
import com.odontologia.odontologia.Repository.PasswordResetTokenRepository;
import com.odontologia.odontologia.Repository.RolRepository;
import com.odontologia.odontologia.Repository.UsuarioRepository;
import com.odontologia.odontologia.Service.EmailService;

/**
 * Fase A del fortalecimiento del login: las contraseñas se almacenan como
 * hash BCrypt (nunca en texto plano) y las claves legadas migran al
 * autenticar (re-hash al entrar).
 */
@ExtendWith(MockitoExtension.class)
class UsuarioPasswordSecurityTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RolRepository rolRepository;

    @Mock
    private PasswordResetTokenRepository resetTokenRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UsuarioServiceImpl usuarioService;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(12);

    @BeforeEach
    void inyectarEncoder() {
        ReflectionTestUtils.setField(usuarioService, "passwordEncoder", encoder);
        Rol rol = new Rol();
        rol.setId(3L);
        rol.setNombre("Recepcionista");
        lenient().when(rolRepository.findById(3L)).thenReturn(Optional.of(rol));
        lenient().when(usuarioRepository.save(any(Usuario.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private UsuarioDto dtoBase() {
        UsuarioDto dto = new UsuarioDto();
        dto.setNombres("Ana");
        dto.setApellidos("Pérez");
        dto.setTipoDocumento("CC");
        dto.setDocumento("1234567890");
        dto.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        dto.setGenero("F");
        dto.setEmail("ana@example.com");
        dto.setTelefono("3001234567");
        dto.setPassword("ClaveSegura123");
        return dto;
    }

    private Usuario entidadLegada(String passwordEnBd) {
        Usuario u = new Usuario();
        u.setId(1L);
        u.setNombres("Ana");
        u.setApellidos("Pérez");
        u.setTipoDocumento("CC");
        u.setDocumento("1234567890");
        u.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        u.setGenero("F");
        u.setEmail("ana@example.com");
        u.setTelefono("3001234567");
        u.setUsername("ana");
        u.setPassword(passwordEnBd);
        u.setActivo(true);
        return u;
    }

    @Test
    void crearUsuarioGuardaHashBCryptYNoElPlano() {
        usuarioService.crearUsuario(dtoBase());

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        String guardado = captor.getValue().getPassword();
        assertNotEquals("ClaveSegura123", guardado, "La clave no debe guardarse en texto plano");
        assertTrue(UsuarioServiceImpl.esHashBCrypt(guardado), "Debe ser un hash BCrypt");
        assertTrue(encoder.matches("ClaveSegura123", guardado));
    }

    @Test
    void crearUsuarioRechazaClaveDebil() {
        UsuarioDto dto = dtoBase();
        dto.setPassword("corta1A");
        RuntimeException e = assertThrows(RuntimeException.class,
                () -> usuarioService.crearUsuario(dto));
        assertTrue(e.getMessage().contains("contraseña"));
    }

    @Test
    void autenticarConHashVerificaConMatches() {
        Usuario u = entidadLegada(encoder.encode("ClaveSegura123"));
        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(u));

        assertDoesNotThrow(() -> usuarioService.autenticar("ana@example.com", "ClaveSegura123"));
        assertThrows(RuntimeException.class,
                () -> usuarioService.autenticar("ana@example.com", "OtraClave123"));
    }

    @Test
    void autenticarMigraClaveLegadaAHash() {
        Usuario u = entidadLegada("admin123");
        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(u));

        usuarioService.autenticar("ana@example.com", "admin123");

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        String migrado = captor.getValue().getPassword();
        assertTrue(UsuarioServiceImpl.esHashBCrypt(migrado), "La clave legada debe migrar a hash");
        assertTrue(encoder.matches("admin123", migrado));
    }

    @Test
    void autenticarLegadaConClaveErroneaNoMigra() {
        Usuario u = entidadLegada("admin123");
        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(u));

        assertThrows(RuntimeException.class,
                () -> usuarioService.autenticar("ana@example.com", "equivocada"));
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void solicitarRecuperacionGuardaSoloHashYEnviaCorreo() {
        Usuario u = entidadLegada(encoder.encode("ClaveSegura123"));
        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(u));

        assertDoesNotThrow(() -> usuarioService.solicitarRecuperacion("ana@example.com"));

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(resetTokenRepository).save(captor.capture());
        String hash = captor.getValue().getCodigoHash();
        assertTrue(hash.matches("^[0-9a-f]{64}$"), "En BD solo debe guardarse el SHA-256 del código");
        assertFalse(captor.getValue().getUsado());
        verify(emailService).enviarCodigoRecuperacion(eq("ana@example.com"), anyString(), anyString());
    }

    @Test
    void solicitarRecuperacionDesconocidoNoRevelaNada() {
        when(usuarioRepository.findByEmail("nadie@example.com")).thenReturn(Optional.empty());
        when(usuarioRepository.findByUsername("nadie@example.com")).thenReturn(Optional.empty());
        when(usuarioRepository.findByDocumento("nadie@example.com")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> usuarioService.solicitarRecuperacion("nadie@example.com"));
        verify(resetTokenRepository, never()).save(any());
        verify(emailService, never()).enviarCodigoRecuperacion(anyString(), anyString(), anyString());
    }

    @Test
    void restablecerPasswordConCodigoValidoCambiaHash() {
        Usuario u = entidadLegada(encoder.encode("ClaveSegura123"));
        PasswordResetToken token = new PasswordResetToken();
        token.setUsuario(u);
        token.setCodigoHash(UsuarioServiceImpl.sha256Hex("123456"));
        token.setExpiraEn(java.time.LocalDateTime.now().plusMinutes(10));
        token.setUsado(false);
        when(resetTokenRepository.findByCodigoHashAndUsadoFalseAndExpiraEnAfter(
                eq(UsuarioServiceImpl.sha256Hex("123456")), any())).thenReturn(Optional.of(token));

        usuarioService.restablecerPassword("123456", "NuevaClave123");

        assertTrue(encoder.matches("NuevaClave123", u.getPassword()));
        assertTrue(token.getUsado());
    }

    @Test
    void restablecerPasswordConCodigoInvalidoFalla() {
        when(resetTokenRepository.findByCodigoHashAndUsadoFalseAndExpiraEnAfter(
                anyString(), any())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class,
                () -> usuarioService.restablecerPassword("000000", "NuevaClave123"));
    }

    @Test
    void restablecerPasswordDebilSeRechaza() {
        assertThrows(RuntimeException.class,
                () -> usuarioService.restablecerPassword("123456", "corta"));
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }
}
