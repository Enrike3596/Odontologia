package com.odontologia.odontologia.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.odontologia.odontologia.Dto.TipoCitaDto;
import com.odontologia.odontologia.Entity.TipoCita;
import com.odontologia.odontologia.Repository.TipoCitaRepository;
import com.odontologia.odontologia.Service.TipoCitaService;

@Service
public class TipoCitaServiceImpl implements TipoCitaService {

	@Autowired
	private TipoCitaRepository tipoCitaRepository;

	@Override
	public List<TipoCitaDto> listarTipoCitas() {
		List<TipoCita> list = tipoCitaRepository.findAll();
		return list.stream().map(this::convertirEntityADto).collect(Collectors.toList());
	}

	@Override
	public TipoCitaDto obtenerTipoCitaPorId(Long id) {
		TipoCita t = tipoCitaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("TipoCita no encontrado con ID: " + id));
		return convertirEntityADto(t);
	}

	@Override
	public TipoCitaDto crearTipoCita(TipoCitaDto tipoCitaDto) {
		TipoCita t = convertirDtoAEntity(tipoCitaDto);
		TipoCita guardado = tipoCitaRepository.save(t);
		return convertirEntityADto(guardado);
	}

	@Override
	public TipoCitaDto actualizarTipoCita(Long id, TipoCitaDto tipoCitaDto) {
		TipoCita existente = tipoCitaRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("TipoCita no encontrado con ID: " + id));

		existente.setNombre(tipoCitaDto.getNombre());
		existente.setDescripcion(tipoCitaDto.getDescripcion());

		TipoCita actualizado = tipoCitaRepository.save(existente);
		return convertirEntityADto(actualizado);
	}

	@Override
	public void eliminarTipoCita(Long id) {
		if (!tipoCitaRepository.existsById(id)) {
			throw new RuntimeException("TipoCita no encontrado con ID: " + id);
		}
		tipoCitaRepository.deleteById(id);
	}

	private TipoCitaDto convertirEntityADto(TipoCita t) {
		TipoCitaDto dto = new TipoCitaDto();
		dto.setId(t.getId());
		dto.setNombre(t.getNombre());
		dto.setDescripcion(t.getDescripcion());
		return dto;
	}

	private TipoCita convertirDtoAEntity(TipoCitaDto dto) {
		TipoCita t = new TipoCita();
		t.setId(dto.getId());
		t.setNombre(dto.getNombre());
		t.setDescripcion(dto.getDescripcion());
		return t;
	}
}
