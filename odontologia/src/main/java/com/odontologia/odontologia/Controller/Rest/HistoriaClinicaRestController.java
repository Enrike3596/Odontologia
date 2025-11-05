package com.odontologia.odontologia.Controller.Rest;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.odontologia.odontologia.Dto.HistoriaClinicaDto;
import com.odontologia.odontologia.Service.HistoriaClinicaService;

@RestController
@RequestMapping("/api")
public class HistoriaClinicaRestController {

    @Autowired
    private HistoriaClinicaService historiaClinicaService;

    // Listar todas las historias clínicas
    @GetMapping("/historias-clinicas")
    public List<HistoriaClinicaDto> listarHistoriasClinicas() {
        return historiaClinicaService.listarHistoriaClinicas();
    }

    // Obtener historia clínica por ID
    @GetMapping("/historias-clinicas/{id}")
    public HistoriaClinicaDto obtenerHistoriaClinicaPorId(@PathVariable Long id) {
        return historiaClinicaService.obtenerHistoriaClinicaPorId(id);
    }

    // Crear nueva historia clínica
    @PostMapping("/historias-clinicas")
    public HistoriaClinicaDto crearHistoriaClinica(@RequestBody HistoriaClinicaDto historiaClinicaDto) {
        return historiaClinicaService.crearHistoriaClinica(historiaClinicaDto);
    }

    // Actualizar historia clínica existente
    @PutMapping("/historias-clinicas/{id}")
    public HistoriaClinicaDto actualizarHistoriaClinica(@PathVariable Long id, @RequestBody HistoriaClinicaDto historiaClinicaDto) {
        return historiaClinicaService.actualizarHistoriaClinica(id, historiaClinicaDto);
    }

    // Eliminar historia clínica
    @DeleteMapping("/historias-clinicas/{id}")
    public void eliminarHistoriaClinica(@PathVariable Long id) {
        historiaClinicaService.eliminarHistoriaClinica(id);
    }
}
