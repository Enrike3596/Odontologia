package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.RolDto;
import com.odontologia.odontologia.Dto.UsuarioDto;
import com.odontologia.odontologia.Entity.Genero;
import com.odontologia.odontologia.Entity.Rol;
import com.odontologia.odontologia.Entity.TipoDocumento;
import com.odontologia.odontologia.Entity.Usuario;
import com.odontologia.odontologia.Repository.PasswordResetTokenRepository;
import com.odontologia.odontologia.Repository.RolRepository;
import com.odontologia.odontologia.Repository.UsuarioRepository;
import com.odontologia.odontologia.Service.EmailService;
import com.odontologia.odontologia.Service.UsuarioService;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UsuarioServiceImpl implements UsuarioService {

	/**
	 * Política de contraseñas: mínimo 10 caracteres, con mayúscula,
	 * minúscula y número. Se aplica al crear, actualizar y restablecer;
	 * nunca al autenticar (para no filtrar información).
	 */
	public static final int PASSWORD_MIN_LENGTH = 10;

	@Autowired
	private UsuarioRepository usuarioRepository;
	
	@Autowired
	private RolRepository rolRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private PasswordResetTokenRepository resetTokenRepository;

	@Autowired(required = false)
	private EmailService emailService;

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

	/** Valida la política y devuelve el hash BCrypt (nunca el texto plano). */
	public String codificarPassword(String passwordPlana) {
		validarPoliticaPassword(passwordPlana);
		return passwordEncoder.encode(passwordPlana);
	}

	public static void validarPoliticaPassword(String password) {
		if (password == null || password.length() < PASSWORD_MIN_LENGTH) {
			throw new RuntimeException(
					"La contraseña debe tener al menos " + PASSWORD_MIN_LENGTH + " caracteres");
		}
		boolean mayus = false, minus = false, numero = false;
		for (char c : password.toCharArray()) {
			if (Character.isUpperCase(c)) mayus = true;
			else if (Character.isLowerCase(c)) minus = true;
			else if (Character.isDigit(c)) numero = true;
		}
		if (!mayus || !minus || !numero) {
			throw new RuntimeException(
					"La contraseña debe incluir mayúscula, minúscula y número");
		}
	}

	/** Detecta hashes BCrypt ($2a$/$2b$/$2y$) frente a valores legados en plano. */
	public static boolean esHashBCrypt(String valor) {
		return valor != null && valor.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$");
	}

	@Override
	public UsuarioDto crearUsuario(UsuarioDto usuarioDto) {
		try {
			// Validaciones básicas
			if (usuarioDto.getNombres() == null || usuarioDto.getNombres().trim().isEmpty()) {
				throw new RuntimeException("El nombre es requerido");
			}
			if (usuarioDto.getApellidos() == null || usuarioDto.getApellidos().trim().isEmpty()) {
				throw new RuntimeException("Los apellidos son requeridos");
			}
			if (usuarioDto.getEmail() == null || usuarioDto.getEmail().trim().isEmpty()) {
				throw new RuntimeException("El email es requerido");
			}
			if (usuarioDto.getDocumento() == null || usuarioDto.getDocumento().trim().isEmpty()) {
				throw new RuntimeException("El documento es requerido");
			}
			
			// Crear entidad Usuario
			Usuario u = new Usuario();
			u.setNombres(usuarioDto.getNombres());
			u.setApellidos(usuarioDto.getApellidos());
			u.setTipoDocumento(TipoDocumento.desde(usuarioDto.getTipoDocumento()).getCodigo());
			u.setDocumento(usuarioDto.getDocumento());
			u.setFechaNacimiento(usuarioDto.getFechaNacimiento());
			u.setGenero(Genero.desde(usuarioDto.getGenero()).getCodigo());
			u.setEmail(usuarioDto.getEmail());
			u.setTelefono(usuarioDto.getTelefono());
			u.setDireccion(usuarioDto.getDireccion());
			u.setActivo(usuarioDto.getActivo() != null ? usuarioDto.getActivo() : true);
			
		// La contraseña es obligatoria y se almacena solo como hash BCrypt.
		// (Se eliminó la clave temporal "temp123" en texto plano.)
		if (usuarioDto.getPassword() == null || usuarioDto.getPassword().isEmpty()) {
			throw new RuntimeException("La contraseña es requerida");
		}
		u.setPassword(codificarPassword(usuarioDto.getPassword()));
			
			// Si no se proporciona username, generamos uno basado en email
			if (usuarioDto.getUsername() == null || usuarioDto.getUsername().isEmpty()) {
				String email = usuarioDto.getEmail();
				if (email != null && email.contains("@")) {
					u.setUsername(email.split("@")[0]);
				} else {
					throw new RuntimeException("El email no tiene un formato válido");
				}
			} else {
				u.setUsername(usuarioDto.getUsername());
			}
			
			// Manejar el rol
			if (usuarioDto.getRol() == null || usuarioDto.getRol().getId() == null) {
				// Asignar rol por defecto: recepcionista
				Rol rolPorDefecto = rolRepository.findById(3L)
					.orElseThrow(() -> new RuntimeException("Rol por defecto no encontrado"));
				u.setRol(rolPorDefecto);
			} else {
				// Validar que el rol proporcionado existe
				Rol rolExistente = rolRepository.findById(usuarioDto.getRol().getId())
					.orElseThrow(() -> new RuntimeException("El rol especificado no existe"));
				u.setRol(rolExistente);
			}
			
			Usuario guardado = usuarioRepository.save(u);
			return convertirEntityADto(guardado);
		} catch (Exception e) {
			throw new RuntimeException("Error al crear usuario: " + e.getMessage(), e);
		}
	}

	@Override
	public UsuarioDto actualizarUsuario(Long id, UsuarioDto usuarioDto) {
		Usuario existente = usuarioRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

		existente.setNombres(usuarioDto.getNombres());
		existente.setApellidos(usuarioDto.getApellidos());
		existente.setTipoDocumento(TipoDocumento.desde(usuarioDto.getTipoDocumento()).getCodigo());
		existente.setDocumento(usuarioDto.getDocumento());
		existente.setFechaNacimiento(usuarioDto.getFechaNacimiento());
		existente.setGenero(Genero.desde(usuarioDto.getGenero()).getCodigo());
		existente.setEmail(usuarioDto.getEmail());
		existente.setTelefono(usuarioDto.getTelefono());
		existente.setDireccion(usuarioDto.getDireccion());
		existente.setUsername(usuarioDto.getUsername());
		if (usuarioDto.getActivo() != null) {
			existente.setActivo(usuarioDto.getActivo());
		}
		// Solo actualizar password si se proporciona (se guarda como hash BCrypt)
		if (usuarioDto.getPassword() != null && !usuarioDto.getPassword().isEmpty()) {
			existente.setPassword(codificarPassword(usuarioDto.getPassword()));
		}
		if (usuarioDto.getRol() != null && usuarioDto.getRol().getId() != null) {
			Rol rol = rolRepository.findById(usuarioDto.getRol().getId())
					.orElseThrow(() -> new RuntimeException("El rol especificado no existe"));
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

	@Override
	public UsuarioDto autenticar(String identifier, String password) {
		if (identifier == null || identifier.trim().isEmpty()) {
			throw new RuntimeException("El identificador es requerido");
		}
		if (password == null || password.isEmpty()) {
			throw new RuntimeException("La contraseña es requerida");
		}

		String id = identifier.trim();
		Usuario usuario = buscarPorIdentificador(id);

		if (usuario.getActivo() == null || !usuario.getActivo()) {
			throw new RuntimeException("Usuario inactivo. Contacte al administrador");
		}

	// Verificación con BCrypt. Migración transparente de claves legadas:
	// si el valor en BD aún está en texto plano y coincide, se re-hashea
	// y se guarda en el acto (el usuario no percibe el cambio).
		String guardado = usuario.getPassword();
		if (esHashBCrypt(guardado)) {
			if (!passwordEncoder.matches(password, guardado)) {
				throw new RuntimeException("Credenciales inválidas");
			}
		} else {
			if (!password.equals(guardado)) {
				throw new RuntimeException("Credenciales inválidas");
			}
			usuario.setPassword(passwordEncoder.encode(password));
			usuarioRepository.save(usuario);
		}

		return convertirEntityADto(usuario);
	}

	private Usuario buscarPorIdentificador(String id) {
		return usuarioRepository.findByEmail(id)
				.or(() -> usuarioRepository.findByUsername(id))
				.or(() -> usuarioRepository.findByDocumento(id))
				.orElseThrow(() -> new RuntimeException("Credenciales inválidas"));
	}

	@Override
	@org.springframework.transaction.annotation.Transactional
	public void solicitarRecuperacion(String identifier) {
		if (identifier == null || identifier.trim().isEmpty()) {
			throw new RuntimeException("El identificador es requerido");
		}
		String id = identifier.trim();
		Usuario usuario;
		try {
			usuario = buscarPorIdentificador(id);
		} catch (RuntimeException e) {
			return; // Respuesta genérica: no revelar si el identificador existe
		}
		if (usuario.getActivo() == null || !usuario.getActivo()) {
			return;
		}
		String email = usuario.getEmail();
		if (email == null || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
			return;
		}
		// Invalidar códigos previos pendientes del usuario
		resetTokenRepository.findByUsuarioIdAndUsadoFalse(usuario.getId())
				.forEach(t -> {
					t.setUsado(true);
					resetTokenRepository.save(t);
				});
		// Código de 6 dígitos con vigencia de 15 minutos (en BD solo su SHA-256)
		String codigo;
		try {
			int n = java.security.SecureRandom.getInstanceStrong().nextInt(900_000) + 100_000;
			codigo = String.valueOf(n);
		} catch (java.security.NoSuchAlgorithmException e) {
			codigo = String.valueOf(new java.security.SecureRandom().nextInt(900_000) + 100_000);
		}
		com.odontologia.odontologia.Entity.PasswordResetToken token =
				new com.odontologia.odontologia.Entity.PasswordResetToken();
		token.setUsuario(usuario);
		token.setCodigoHash(sha256Hex(codigo));
		token.setExpiraEn(java.time.LocalDateTime.now().plusMinutes(15));
		token.setUsado(false);
		token.setCreadoEn(java.time.LocalDateTime.now());
		resetTokenRepository.save(token);

		try {
			if (emailService != null) {
				String nombre = ((usuario.getNombres() != null ? usuario.getNombres() : "")
						+ " " + (usuario.getApellidos() != null ? usuario.getApellidos() : "")).trim();
				emailService.enviarCodigoRecuperacion(email.trim(), nombre, codigo);
			}
		} catch (Exception e) {
			System.err.println("[Recuperación] No se pudo enviar el código al usuario "
					+ usuario.getId() + ": " + e.getMessage());
		}
	}

	@Override
	@org.springframework.transaction.annotation.Transactional
	public void restablecerPassword(String codigo, String nuevaPassword) {
		if (codigo == null || codigo.trim().isEmpty()) {
			throw new RuntimeException("El código es requerido");
		}
		validarPoliticaPassword(nuevaPassword);
		com.odontologia.odontologia.Entity.PasswordResetToken token = resetTokenRepository
				.findByCodigoHashAndUsadoFalseAndExpiraEnAfter(
						sha256Hex(codigo.trim()), java.time.LocalDateTime.now())
				.orElseThrow(() -> new RuntimeException("Código inválido o vencido"));
		Usuario usuario = token.getUsuario();
		usuario.setPassword(passwordEncoder.encode(nuevaPassword));
		usuarioRepository.save(usuario);
		token.setUsado(true);
		resetTokenRepository.save(token);
	}

	/** Limpieza diaria de códigos vencidos (higiene de la tabla). */
	@org.springframework.scheduling.annotation.Scheduled(cron = "0 0 3 * * *")
	@org.springframework.transaction.annotation.Transactional
	public void purgarCodigosVencidos() {
		try {
			resetTokenRepository.deleteByExpiraEnBefore(java.time.LocalDateTime.now());
		} catch (Exception e) {
			System.err.println("[Recuperación] No se pudieron purgar códigos: " + e.getMessage());
		}
	}

	public static String sha256Hex(String texto) {
		try {
			java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
			byte[] digest = md.digest(texto.getBytes(java.nio.charset.StandardCharsets.UTF_8));
			StringBuilder sb = new StringBuilder();
			for (byte b : digest) {
				sb.append(String.format("%02x", b));
			}
			return sb.toString();
		} catch (java.security.NoSuchAlgorithmException e) {
			throw new RuntimeException("SHA-256 no disponible", e);
		}
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
}
