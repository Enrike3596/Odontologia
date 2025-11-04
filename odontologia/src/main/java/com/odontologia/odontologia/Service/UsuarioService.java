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
}
