package com.odontologia.odontologia.Controller.Mvc;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class VistaController {

    @GetMapping("/")
    public String index() {
        return "home"; // Carga templates/home.html
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "home"; // Carga templates/home.html
    }

    @GetMapping("/citas")
    public String citas() {
        return "citas"; // Carga templates/citas.html
    }

    @GetMapping("/pacientes")
    public String pacientes() {
        return "Pacientes"; // Carga templates/Pacientes.html
    }

    @GetMapping("/odontologos")
    public String odontologos() {
        return "Odontologos"; // Carga templates/Odontologos.html
    }

    @GetMapping("/historias-clinicas")
    public String historiasClinicas() {
        return "HistoriasClinicas"; // Carga templates/HistoriasClinicas.html
    }

    @GetMapping("/usuarios")
    public String usuarios() {
        return "Usuarios"; // Carga templates/Usuarios.html
    }

    @GetMapping("/configuracion")
    public String configuracion() {
        return "configuracion"; // Carga templates/configuracion.html (por crear)
    }
}
