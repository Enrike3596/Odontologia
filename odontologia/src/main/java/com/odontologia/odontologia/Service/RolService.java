package com.odontologia.odontologia.Service;

import java.util.List;

import com.odontologia.odontologia.Dto.RolDto;

public interface RolService {
    // aqui van los metodos del servicio
    List<RolDto> listarRoles();
    RolDto obtenerRolPorId(Long id);
    RolDto crearRol(RolDto rolDto);
    RolDto actualizarRol(Long id, RolDto rolDto);
    void eliminarRol(Long id);
}
