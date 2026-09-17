package com.odontologia.odontologia.Config;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Límite de intentos de login en memoria: 5 fallos por identificador+IP
 * en 15 minutos bloquean el acceso con 429. Un login exitoso limpia el
 * contador. Mitiga fuerza bruta sin dependencias extra.
 */
@Component
public class LoginAttemptService {

    public static final int MAX_INTENTOS = 5;
    public static final long VENTANA_SEGUNDOS = 15 * 60;

    private record Ventana(int fallos, long expiraEn) {
    }

    private final Map<String, Ventana> intentos = new ConcurrentHashMap<>();

    private String clave(String identificador, String ip) {
        String id = identificador == null ? "" : identificador.trim().toLowerCase();
        return id + "|" + (ip == null ? "" : ip);
    }

    /** Segundos restantes de bloqueo, o 0 si puede intentar. */
    public synchronized long bloqueoRestanteSeg(String identificador, String ip) {
        Ventana v = intentos.get(clave(identificador, ip));
        if (v == null) {
            return 0;
        }
        long ahora = Instant.now().getEpochSecond();
        if (v.expiraEn() <= ahora) {
            intentos.remove(clave(identificador, ip));
            return 0;
        }
        return v.fallos() >= MAX_INTENTOS ? v.expiraEn() - ahora : 0;
    }

    public synchronized void registrarFallo(String identificador, String ip) {
        String k = clave(identificador, ip);
        long ahora = Instant.now().getEpochSecond();
        Ventana v = intentos.get(k);
        if (v == null || v.expiraEn() <= ahora) {
            intentos.put(k, new Ventana(1, ahora + VENTANA_SEGUNDOS));
        } else {
            intentos.put(k, new Ventana(v.fallos() + 1, v.expiraEn()));
        }
    }

    public synchronized void registrarExito(String identificador, String ip) {
        intentos.remove(clave(identificador, ip));
    }
}
