package com.odontologia.odontologia.Controller.Rest;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.odontologia.odontologia.Enums.EstadoCitaEnum;
import com.odontologia.odontologia.Enums.Genero;
import com.odontologia.odontologia.Enums.Parentesco;
import com.odontologia.odontologia.Enums.TipoDocumento;

/**
 * Catálogos centrales del sistema (punto 4 del plan de acción).
 * Única fuente de verdad para los selects de tipo de documento,
 * género, parentesco y estado de cita. El tipo de cita se mantiene
 * como tabla administrable (/api/tipos-cita) y no como enum.
 */
@RestController
@RequestMapping("/api")
public class CatalogoRestController {

    @GetMapping("/catalogos")
    public Map<String, List<Map<String, String>>> catalogos() {
        Map<String, List<Map<String, String>>> res = new LinkedHashMap<>();
        res.put("tiposDocumento", Arrays.stream(TipoDocumento.values())
                .map(t -> item(t.getCodigo(), t.getEtiqueta()))
                .collect(Collectors.toList()));
        res.put("generos", Arrays.stream(Genero.values())
                .map(g -> item(g.getCodigo(), g.getEtiqueta()))
                .collect(Collectors.toList()));
        res.put("parentescos", Arrays.stream(Parentesco.values())
                .map(p -> item(p.getEtiqueta(), p.getEtiqueta()))
                .collect(Collectors.toList()));
        res.put("estadosCita", Arrays.stream(EstadoCitaEnum.values())
                .map(e -> item(e.name(), e.name()))
                .collect(Collectors.toList()));
        return res;
    }

    private Map<String, String> item(String codigo, String etiqueta) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("codigo", codigo);
        m.put("etiqueta", etiqueta);
        return m;
    }
}
