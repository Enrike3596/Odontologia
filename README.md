# Sistema de Gestión Odontológica 🦷

Sistema web para la gestión integral de una clínica odontológica: administración de **usuarios, pacientes, odontólogos, citas, historias clínicas, tipos de cita y roles**, con autenticación por email/usuario/documento.

---

## 1. Tecnologías utilizadas

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| **Java** | 21 | Lenguaje principal |
| **Spring Boot** | 3.5.6 | Framework base (parent `spring-boot-starter-parent`) |
| **Spring Web (MVC + REST)** | — | Controladores MVC (`VistaController`) y API REST (`/api/**`) |
| **Spring Data JPA / Hibernate** | — | Persistencia, entidades y repositorios. `ddl-auto=update` |
| **Thymeleaf** | — | Renderizado server-side de vistas (`src/main/resources/templates/`) |
| **Spring Actuator** | — | Monitoreo y health checks |
| **Spring DevTools** | — | Recarga en caliente en desarrollo |
| **Lombok** | — | Reducción de boilerplate (`@Data`, `@Entity`, DTOs) |
| **PostgreSQL Driver** | runtime | Conexión JDBC a PostgreSQL |
| **Maven** | — | Gestión de dependencias y build (`pom.xml`, `mvnw` / `mvnw.cmd`) |
| **JUnit / spring-boot-starter-test** | — | Pruebas (`OdontologiaApplicationTests`) |

### Frontend
| Tecnología | Uso |
|---|---|
| **Thymeleaf + HTML5** | Vistas: `home.html`, `login.html`, `citas.html`, `Pacientes.html`, `Odontologos.html`, `HistoriasClinicas.html`, `Usuarios.html`, `configuracion.html`, `Pagina inicial/index.html` |
| **JavaScript vanilla (Fetch API)** | Lógica por módulo: `login.js`, `citas.js`, `pacientes.js`, `odontologos.js`, `historiaclinica.js`, `usuarios.js`, `home.js`, `navigation.js`, `sidebar.js`, `components.js`, `auth-guard.js`, `user-session.js`, `table-pager.js`, `contacto.js` |
| **CSS propio (`app.css`) + Bootstrap 5.0.5-alpha** | Estilos del panel administrativo y de la página pública inicial |
| **LineIcons 2.0, animate.css, tiny-slider, wow.js** | Iconos, animaciones y slider de la landing page (`Pagina Inicial/`) |
| **Componentes reutilizables** | `static/Components/sidebar.html` y `topbar.html` cargados vía JS |

### Base de datos
| Tecnología | Detalle |
|---|---|
| **PostgreSQL 5432** | BD `odontologia` (ver `odontologia/base.sql`) |
| Tablas | `roles`, `usuarios`, `pacientes`, `odontologos`, `tipos_cita`, `historias_clinicas`, `citas` |
| Script base | `odontologia/base.sql` — re-ejecutable, crea tablas + datos semilla (3 roles, usuario admin, 5 pacientes, 3 odontólogos, 4 tipos de cita, 2 citas) |

> Credencial inicial (cambiar en producción): `admin@clinica.com` / `admin` / `admin123`.

---

## 2. Arquitectura

Arquitectura en **capas (N-Layer) estilo monolito MVC + API REST**, todo dentro de un único deployable Spring Boot:

```
                    ┌─────────────────────────────────┐
                    │           NAVEGADOR             │
                    │ Thymeleaf + JS (fetch /api/**)  │
                    └───────────────┬─────────────────┘
                                    │ HTTP
                    ┌───────────────▼─────────────────┐
                    │   CONTROLLERS (Web Layer)       │
                    │ • Mvc/VistaController → vistas  │
                    │ • Rest/*RestController → JSON   │
                    └───────────────┬─────────────────┘
                                    │ DTOs
                    ┌───────────────▼─────────────────┐
                    │   SERVICE (Lógica de negocio)   │
                    │ Interfaces Service + Impl/      │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │  REPOSITORY (Spring Data JPA)   │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │   ENTITY (JPA) ↔ PostgreSQL     │
                    └─────────────────────────────────┘
```

### Capas (paquetes en `com.odontologia.odontologia`)

| Capa | Paquete | Contenido |
|---|---|---|
| Presentación web | `Controller.Mvc` | `VistaController` — rutas `/`, `/inicio`, `/dashboard`, `/citas`, `/pacientes`, `/odontologos`, `/historias-clinicas`, `/usuarios`, `/configuracion`, `/login` → plantillas Thymeleaf |
| API REST | `Controller.Rest` | `AuthRestController`, `UsuarioRestController`, `Paciente2RestController`, `OdontologoRestController`, `Cita2RestController`, `HistoriaClinicaRestController`, `TipoCitaRestController`, `RolRestController` — CRUD JSON bajo `/api` |
| Lógica de negocio | `Service` + `Impl` | Interfaces (`UsuarioService`, `Cita2Service`, …) e implementaciones (`UsuarioServiceImpl`, …). Ej.: `autenticar(identifier, password)` acepta email, username o documento |
| Persistencia | `Repository` | `JpaRepository` por entidad: `UsuarioRepository`, `Paciente2Repository`, `OdontologoRepository`, `Cita2Repository`, `HistoriaClinicaRepository`, `TipoCitaRepository`, `RolRepository` |
| Dominio | `Entity` | `Usuario`, `Rol`, `Paciente2`, `Odontologo`, `Cita2`, `HistoriaClinica`, `TipoCita`, `EstadoCitaEnum` (`PENDIENTE`, `CONFIRMADA`, `CANCELADA`, `COMPLETADA`) |
| Transferencia | `Dto` | `UsuarioDto`, `Paciente2Dto`, `OdontologoDto`, `Cita2Dto`, `HistoriaClinicaDto`, `TipoCitaDto`, `RolDto`, `LoginRequestDto` |
| Configuración | `Config` | `WebCacheConfig` (caché de recursos estáticos) |

### Patrones
- **MVC server-side** (Thymeleaf) para las páginas + **REST + AJAX** (JS `fetch`) para los datos — sin SPA framework.
- **DTO** para desacoplar entidades JPA del JSON/vistas.
- **Repository + Service Interface/Impl** (inyección con `@Autowired`).
- Sesión de usuario en cliente (`user-session.js` + `auth-guard.js`); login stateful simple sin JWT/Spring Security.

---

## 3. Estructura del proyecto

```
Odontologia/
├── README.md                  ← este archivo
└── odontologia/               ← módulo Maven / app Spring Boot
    ├── pom.xml
    ├── mvnw / mvnw.cmd
    ├── base.sql               ← DDL + datos semilla PostgreSQL
    └── src/
        ├── main/
        │   ├── java/com/odontologia/odontologia/
        │   │   ├── OdontologiaApplication.java
        │   │   ├── Config/        → WebCacheConfig
        │   │   ├── Controller/
        │   │   │   ├── Mvc/       → VistaController
        │   │   │   └── Rest/      → Auth, Usuario, Paciente2, Odontologo,
        │   │   │                    Cita2, HistoriaClinica, TipoCita, Rol
        │   │   ├── Dto/           → *Dto, LoginRequestDto
        │   │   ├── Entity/        → Usuario, Rol, Paciente2, Odontologo,
        │   │   │                    Cita2, HistoriaClinica, TipoCita, EstadoCitaEnum
        │   │   ├── Repository/    → JpaRepositories
        │   │   ├── Service/       → interfaces
        │   │   └── Impl/          → implementaciones
        │   └── resources/
        │       ├── application.properties
        │       ├── templates/     → *.html (Thymeleaf)
        │       └── static/
        │           ├── js/        → lógica frontend por módulo
        │           ├── css/       → app.css + Pagina Inicial/
        │           ├── Imagenes/
        │           └── Components/→ sidebar.html, topbar.html
        └── test/                  → OdontologiaApplicationTests
```

---

## 4. API REST — endpoints

Base: `http://localhost:8080/api`

| Módulo | Método | Ruta | Descripción |
|---|---|---|---|
| Auth | `POST` | `/api/auth/login` | Login con `{ identifier, password }` (email, username o documento). `200` + `UsuarioDto`, `400` faltantes, `401` credenciales inválidas, `403` usuario inactivo |
| Usuarios | `GET` | `/api/usuarios`, `/api/usuarios/{id}` | Listar / obtener |
| Usuarios | `POST` | `/api/usuarios` | Crear (rol por defecto si no se envía) |
| Pacientes | `GET` | `/api/pacientes`, `/api/pacientes/{id}` | Listar / obtener |
| Pacientes | `POST` | `/api/pacientes` | Crear |
| Odontólogos | `GET` | `/api/odontologos`, `/api/odontologos/{id}` | Listar / obtener |
| Odontólogos | `POST` | `/api/odontologos` | Crear |
| Citas | `GET` | `/api/citas`, `/api/citas/{id}` | Listar / obtener |
| Citas | `POST` | `/api/citas` | Crear |
| Historias | `GET` | `/api/historias-clinicas`, `/api/historias-clinicas/{id}` | Listar / obtener (1 por paciente) |
| Historias | `POST` | `/api/historias-clinicas` | Crear |
| Tipos cita | `GET` | `/api/tipos-cita`, `/api/tipos-cita/{id}` | Listar / obtener |
| Tipos cita | `POST` | `/api/tipos-cita` | Crear |
| Roles | `GET` | `/api/roles`, `/api/roles/{id}` | Listar / obtener (1=Administrador, 2=Odontólogo, 3=Recepcionista) |
| Roles | `POST` | `/api/roles` | Crear |

Vistas MVC: `/`, `/dashboard` (home), `/inicio` (landing pública), `/login`, `/citas`, `/pacientes`, `/odontologos`, `/historias-clinicas`, `/usuarios`, `/configuracion`.

---

## 5. Requisitos previos

- **Java 21** (`java -version`)
- **Maven 3.9+** (o usar `./mvnw` incluido)
- **PostgreSQL 14+** corriendo en `localhost:5432`

---

## 6. Instalación y ejecución

```bash
# 1. Crear la base de datos (una sola vez)
psql -U postgres -c "CREATE DATABASE odontologia;"

# 2. Cargar esquema + datos semilla
psql -U postgres -d odontologia -f odontologia/base.sql

# 3. Configurar conexión (si tu password difiere)
# Editar odontologia/src/main/resources/application.properties:
# spring.datasource.url=jdbc:postgresql://localhost:5432/odontologia
# spring.datasource.username=postgres
# spring.datasource.password=TU_PASSWORD

# 4. Ejecutar (desde la carpeta odontologia/)
cd odontologia
./mvnw spring-boot:run
# En Windows: mvnw.cmd spring-boot:run

# 5. Abrir
# App:      http://localhost:8080/
# Login:    http://localhost:8080/login
# Landing:  http://localhost:8080/inicio
```

JPA tiene `ddl-auto=update`, por lo que las tablas se crean/actualizan al arrancar aunque no se ejecute `base.sql`; el script además deja los datos base (roles + admin).

---

## 7. Notas técnicas y deuda conocida

- Las contraseñas se guardan y comparan **en texto plano** (`UsuarioServiceImpl` + `base.sql`). Pendiente migrar a **BCrypt + Spring Security / JWT**.
- Sin validación Bean Validation global ni manejo centralizado de excepciones (`@ControllerAdvice`).
- `application.properties` con credenciales de desarrollo hardcodeadas — externalizar vía variables de entorno en producción.
- El frontend no usa framework SPA; la protección de rutas es solo cliente (`auth-guard.js`).

---

## 8. Roadmap sugerido

1. Spring Security + BCrypt + JWT.
2. CRUD completo (PUT/DELETE) en todos los RestControllers.
3. Paginación/filtros server-side y validaciones.
4. `docker-compose.yml` (app + postgres) y perfiles `dev/prod`.
5. Pruebas de integración (Testcontainers) y CI.
