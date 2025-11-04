package com.odontologia.odontologia.Controller.Rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.odontologia.odontologia.Dto.TipoCitaDto;

public class TipoCitaRestController {
    @Autowired
    private com.odontologia.odontologia.Impl.TipoCitaServiceImpl tipoCitaService;

    // Listar todos los tipos de cita
    @GetMapping("/tipos-cita")
    public List<TipoCitaDto> listarTiposCita() {
        return tipoCitaService.listarTipoCitas();
    }

    // Obtener tipo de cita por ID
    @GetMapping("/tipos-cita/{id}")
    public TipoCitaDto obtenerTipoCitaPorId(@PathVariable Long id) {
        return tipoCitaService.obtenerTipoCitaPorId(id);
    }

    // Crear nuevo tipo de cita
    @PostMapping("/tipos-cita")
    public TipoCitaDto crearTipoCita(@RequestBody TipoCitaDto tipoCitaDto) {
        return tipoCitaService.crearTipoCita(tipoCitaDto);
    }

    // Actualizar tipo de cita existente
    @PutMapping("/tipos-cita/{id}")
    public TipoCitaDto actualizarTipoCita(@PathVariable Long id, @RequestBody TipoCitaDto tipoCitaDto) {
        return tipoCitaService.actualizarTipoCita(id, tipoCitaDto);
    }

    // Eliminar tipo de cita
    @DeleteMapping("/tipos-cita/{id}")
    public void eliminarTipoCita(@PathVariable Long id) {
        tipoCitaService.eliminarTipoCita(id);
    }
    
}
