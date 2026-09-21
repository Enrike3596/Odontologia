package com.odontologia.odontologia.Config;

import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.NegatedRequestMatcher;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Seguridad de la aplicación (fortalecimiento del inicio de sesión).
 *
 * <ul>
 *   <li>Contraseñas solo como hash BCrypt (ver {@link #passwordEncoder()}).</li>
 *   <li>Sesión HTTP del lado servidor (JSESSIONID HttpOnly + SameSite, ver
 *   application.properties). El {@code localStorage} del navegador es solo
 *   caché de UI, nunca prueba de acceso.</li>
 *   <li>{@code /api/auth/**} público; {@code /api/**} exige sesión;
 *   la gestión de agenda (apertura/cierre) exige rol Administrador, como
 *   documenta {@code base.sql}.</li>
 *   <li>Sin sesión: la API responde 401 JSON; las vistas redirigen a /login.
 *   Sin rol: la API responde 403 JSON.</li>
 *   <li>CSRF por token desactivado para {@code /api/**}: la app es
 *   misma-origen con fetch y la cookie de sesión es {@code SameSite=Lax},
 *   lo que bloquea el envío cross-site de la cookie en POST/PUT/DELETE.</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    /**
     * BCrypt con costo 12: hash de 60 caracteres con sal aleatoria.
     * La columna {@code usuarios.password} (VARCHAR 255) lo almacena sin
     * recortes. Verificar siempre con {@code matches()}, nunca con equals.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        ObjectMapper json = new ObjectMapper();
        http
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/inicio", "/login", "/error", "/favicon.ico",
                                "/api/auth/**",
                                "/css/**", "/js/**", "/Imagenes/**", "/Components/**")
                        .permitAll()
                        // Gestión de agenda (apertura/cierre): solo Administrador
                        .requestMatchers(HttpMethod.POST, "/api/agenda/movimientos").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/agenda/movimientos/**").hasRole("ADMIN")
                        // Finalizar cita: solo el odontólogo (o el administrador)
                        .requestMatchers(HttpMethod.POST, "/api/citas/*/finalizar").hasAnyRole("ADMIN", "ODONTOLOGO")
                        .requestMatchers("/api/**").authenticated()
                        .requestMatchers("/dashboard", "/citas", "/agenda", "/pacientes",
                                "/odontologos", "/historias-clinicas", "/usuarios", "/configuracion")
                        .authenticated()
                        .anyRequest().permitAll())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .sessionManagement(session -> session.sessionFixation(fix -> fix.changeSessionId()))
                .exceptionHandling(e -> e
                        .defaultAuthenticationEntryPointFor(
                                (req, res, ex) -> {
                                    res.setStatus(HttpStatus.UNAUTHORIZED.value());
                                    res.setContentType("application/json");
                                    res.getWriter().write(json.writeValueAsString(
                                            Map.of("error", "Sesión requerida. Inicie sesión.")));
                                },
                                new AntPathRequestMatcher("/api/**"))
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint("/login"),
                                new NegatedRequestMatcher(new AntPathRequestMatcher("/api/**")))
                        .defaultAccessDeniedHandlerFor(
                                (req, res, ex) -> {
                                    res.setStatus(HttpStatus.FORBIDDEN.value());
                                    res.setContentType("application/json");
                                    res.getWriter().write(json.writeValueAsString(
                                            Map.of("error", "Acceso denegado para su rol.")));
                                },
                                new AntPathRequestMatcher("/api/**"))
                        .accessDeniedHandler((req, res, ex) -> {
                            HttpServletResponse r = res;
                            r.sendRedirect("/dashboard");
                        }));
        return http.build();
    }
}
