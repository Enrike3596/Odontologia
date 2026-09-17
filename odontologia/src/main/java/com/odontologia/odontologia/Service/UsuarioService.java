package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.UsuarioDto;

public interface UsuarioService {
    // aqui van los metodos del servicio
    List<UsuarioDto> listarUsuarios();
    UsuarioDto obtenerUsuarioPorId(Long id);
    UsuarioDto crearUsuario(UsuarioDto usuarioDto);
    UsuarioDto actualizarUsuario(Long id, UsuarioDto usuarioDto);
    void eliminarUsuario(Long id);
    /**
     * Autentica un usuario por email, username o documento + contrasena.
     * @param identifier email, username o documento
     * @param password contrasena en texto plano (se compara con la stored)
     * @return DTO del usuario autenticado (sin password)
     * @throws RuntimeException si las credenciales son invalidas o el usuario esta inactivo
     */
    UsuarioDto autenticar(String identifier, String password);
    /**
     * Solicita un código de recuperación (6 dígitos, 15 min de vigencia)
     * enviado al correo del usuario. Respuesta siempre genérica para no
     * revelar si el identificador existe.
     */
    void solicitarRecuperacion(String identifier);
    /**
     * Canjea el código de recuperación por una contraseña nueva (aplica la
     * política de claves y la guarda como hash BCrypt). Uso único.
     */
    void restablecerPassword(String codigo, String nuevaPassword);
}
