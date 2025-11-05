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
		// Si no se proporciona password, generamos una temporal
		if (u.getPassword() == null || u.getPassword().isEmpty()) {
			u.setPassword("temp123"); // En producción debería ser encriptada
		}
		// Si no se proporciona username, generamos uno basado en email
		if (u.getUsername() == null || u.getUsername().isEmpty()) {
			u.setUsername(usuarioDto.getEmail().split("@")[0]);
		}
		Usuario guardado = usuarioRepository.save(u);
		return convertirEntityADto(guardado);
	}

	@Override
	public UsuarioDto actualizarUsuario(Long id, UsuarioDto usuarioDto) {
		Usuario existente = usuarioRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

		existente.setNombres(usuarioDto.getNombres());
		existente.setApellidos(usuarioDto.getApellidos());
		existente.setTipoDocumento(usuarioDto.getTipoDocumento());
		existente.setDocumento(usuarioDto.getDocumento());
		existente.setFechaNacimiento(usuarioDto.getFechaNacimiento());
		existente.setGenero(usuarioDto.getGenero());
		existente.setEmail(usuarioDto.getEmail());
		existente.setTelefono(usuarioDto.getTelefono());
		existente.setDireccion(usuarioDto.getDireccion());
		existente.setUsername(usuarioDto.getUsername());
		if (usuarioDto.getActivo() != null) {
			existente.setActivo(usuarioDto.getActivo());
		}
		// Solo actualizar password si se proporciona
		if (usuarioDto.getPassword() != null && !usuarioDto.getPassword().isEmpty()) {
			existente.setPassword(usuarioDto.getPassword());
		}
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
		dto.setNombres(u.getNombres());
		dto.setApellidos(u.getApellidos());
		dto.setTipoDocumento(u.getTipoDocumento());
		dto.setDocumento(u.getDocumento());
		dto.setFechaNacimiento(u.getFechaNacimiento());
		dto.setGenero(u.getGenero());
		dto.setEmail(u.getEmail());
		dto.setTelefono(u.getTelefono());
		dto.setDireccion(u.getDireccion());
		dto.setUsername(u.getUsername());
		// No incluir password por seguridad
		dto.setPassword(null);
		dto.setActivo(u.getActivo());
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
		u.setNombres(dto.getNombres());
		u.setApellidos(dto.getApellidos());
		u.setTipoDocumento(dto.getTipoDocumento());
		u.setDocumento(dto.getDocumento());
		u.setFechaNacimiento(dto.getFechaNacimiento());
		u.setGenero(dto.getGenero());
		u.setEmail(dto.getEmail());
		u.setTelefono(dto.getTelefono());
		u.setDireccion(dto.getDireccion());
		u.setUsername(dto.getUsername());
		u.setPassword(dto.getPassword());
		u.setActivo(dto.getActivo() != null ? dto.getActivo() : true);
		if (dto.getRol() != null && dto.getRol().getId() != null) {
			Rol r = new Rol();
			r.setId(dto.getRol().getId());
			u.setRol(r);
		}
		return u;
	}
}
