package com.odontologia.odontologia.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Evita que el navegador muestre copias cacheadas de las vistas al usar
 * los botones atras/adelante (p. ej. ver el dashboard tras cerrar sesion
 * o el login tras haber ingresado).
 *
 * No requiere dependencias nuevas: interceptor MVC estandar.
 */
@Configuration
public class WebCacheConfig implements WebMvcConfigurer {

    private static final HandlerInterceptor NO_CACHE_INTERCEPTOR = new HandlerInterceptor() {
        @Override
        public void postHandle(HttpServletRequest request, HttpServletResponse response,
                Object handler, ModelAndView modelAndView) {
            // Solo vistas Thymeleaf (las API y estaticos quedan excluidos en el registro)
            if (modelAndView != null && modelAndView.hasView()) {
                response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
                response.setHeader("Pragma", "no-cache");
                response.setDateHeader("Expires", 0);
            }
        }
    };

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(NO_CACHE_INTERCEPTOR)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/api/**",
                        "/js/**",
                        "/css/**",
                        "/Imagenes/**",
                        "/Components/**",
                        "/favicon.ico",
                        "/error");
    }
}
