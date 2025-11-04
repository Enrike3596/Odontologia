package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.RolDto;
import com.odontologia.odontologia.Dto.UsuarioDto;
import com.odontologia.odontologia.Entity.Rol;
import com.odontologia.odontologia.Entity.Usuario;
import com.odontologia.odontologia.Repository.UsuarioRepository;
import com.odontologia.odontologia.Service.UsuarioService;

@Service
public class UsuarioServiceImpl implements UsuarioService {

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Override
	public List<UsuarioDto> listarUsuarios() {
		List<Usuario> list = usuarioRepository.findAll();
		return list.stream().map(this::convertirEntityADto).collect(Collectors.toList());
	}

	@Override
	public UsuarioDto obtenerUsuarioPorId(Long id) {
		Usuario u = usuarioRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
		return convertirEntityADto(u);
	}

	@Override
	public UsuarioDto crearUsuario(UsuarioDto usuarioDto) {
		Usuario u = convertirDtoAEntity(usuarioDto);
		// Si no se proporciona password, guardamos cadena vacía para respetar nullable=false en DB
		if (u.getPassword() == null) u.setPassword("");
		Usuario guardado = usuarioRepository.save(u);
		return convertirEntityADto(guardado);
	}

	@Override
	public UsuarioDto actualizarUsuario(Long id, UsuarioDto usuarioDto) {
		Usuario existente = usuarioRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

		existente.setUsername(usuarioDto.getNombre());
		// no actualizamos password por seguridad aquí; se puede añadir si se requiere
		if (usuarioDto.getRol() != null && usuarioDto.getRol().getId() != null) {
			Rol rol = new Rol();
			rol.setId(usuarioDto.getRol().getId());
			existente.setRol(rol);
		}

		Usuario actualizado = usuarioRepository.save(existente);
		return convertirEntityADto(actualizado);
	}

	@Override
	public void eliminarUsuario(Long id) {
		if (!usuarioRepository.existsById(id)) {
			throw new RuntimeException("Usuario no encontrado con ID: " + id);
		}
		usuarioRepository.deleteById(id);
	}

	private UsuarioDto convertirEntityADto(Usuario u) {
		UsuarioDto dto = new UsuarioDto();
		dto.setId(u.getId());
		dto.setNombre(u.getUsername());
		// No hay campos email/telefono en la entidad Usuario; dejamos null o vacío
		dto.setEmail(null);
		dto.setTelefono(null);
		if (u.getRol() != null) {
			RolDto r = new RolDto();
			r.setId(u.getRol().getId());
			r.setNombre(u.getRol().getNombre());
			dto.setRol(r);
		}
		return dto;
	}

	private Usuario convertirDtoAEntity(UsuarioDto dto) {
		Usuario u = new Usuario();
		u.setId(dto.getId());
		u.setUsername(dto.getNombre());
		// password no viene desde DTO, dejar null/ vacío
		if (dto.getRol() != null && dto.getRol().getId() != null) {
			Rol r = new Rol();
			r.setId(dto.getRol().getId());
			u.setRol(r);
		}
		return u;
	}
}
