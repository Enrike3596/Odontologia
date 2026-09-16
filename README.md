# Sistema de Gestión Odontológica 🦷

Sistema web para la gestión integral de una clínica odontológica: administración de **usuarios, pacientes, odontólogos, citas, agenda médica mensual, historias clínicas, tipos de cita y roles**, con autenticación por email/usuario/documento, **envío de correos de confirmación/recordatorio vía Gmail SMTP** e **impresión del comprobante de cita**.

---

## 1. Tecnologías utilizadas

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| **Java** | 21 | Lenguaje principal |
| **Spring Boot** | 3.5.6 | Framework base (parent `spring-boot-starter-parent`) |
| **Spring Web (MVC + REST)** | — | Controladores MVC (`VistaController`) y API REST (`/api/**`) |
| **Spring Data JPA / Hibernate** | — | Persistencia, entidades y repositorios. `ddl-auto=update` |
| **Spring Mail (SMTP)** | — | Confirmación y recordatorio de citas por correo (Gmail/Workspace, `app.mail.enabled`) |
| **Thymeleaf** | — | Renderizado server-side de vistas (`src/main/resources/templates/`) + plantillas de correo (`templates/email/`) |
| **Spring Actuator** | — | Monitoreo y health checks |
| **Spring DevTools** | — | Recarga en caliente en desarrollo |
| **Lombok** | — | Reducción de boilerplate (`@Data`, `@Entity`, DTOs) |
| **PostgreSQL Driver** | runtime | Conexión JDBC a PostgreSQL |
| **Maven** | — | Gestión de dependencias y build (`pom.xml`, `mvnw` / `mvnw.cmd`) |
| **JUnit / spring-boot-starter-test** | — | Pruebas (`OdontologiaApplicationTests`) |

### Frontend
| Tecnología | Uso |
|---|---|
| **Thymeleaf + HTML5** | Vistas: `home.html`, `login.html`, `citas.html`, `Agenda.html`, `Pacientes.html`, `Odontologos.html`, `HistoriasClinicas.html`, `Usuarios.html`, `configuracion.html`, `Pagina inicial/index.html`, `email/confirmacion-cita.html`, `email/recordatorio-cita.html` |
| **JavaScript vanilla (Fetch API)** | Lógica por módulo: `login.js`, `citas.js`, `agenda.js`, `catalogos.js`, `pacientes.js`, `odontologos.js`, `historiaclinica.js`, `usuarios.js`, `home.js`, `navigation.js`, `sidebar.js`, `components.js`, `auth-guard.js`, `user-session.js`, `table-pager.js`, `contacto.js` |
| **CSS propio (`app.css`) + Bootstrap 5.0.5-alpha** | Estilos del panel administrativo y de la página pública inicial |
| **LineIcons 2.0, animate.css, tiny-slider, wow.js** | Iconos, animaciones y slider de la landing page (`Pagina Inicial/`) |
| **Componentes reutilizables** | `static/Components/sidebar.html` y `topbar.html` cargados vía JS |

### Base de datos
| Tecnología | Detalle |
|---|---|
| **PostgreSQL 5432** | BD `odontologia` (ver `odontologia/base.sql`) |
| Tablas | `roles`, `usuarios`, `pacientes`, `odontologos`, `tipos_cita`, `historias_clinicas`, `citas`, `bloqueos_agenda` |
| Script base | `odontologia/base.sql` — re-ejecutable, crea tablas + datos semilla (3 roles, usuario admin, 5 pacientes, 3 odontólogos, 4 tipos de cita, 2 citas) + normalización de catálogos |

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
| Presentación web | `Controller.Mvc` | `VistaController` — rutas `/`, `/inicio`, `/dashboard`, `/citas`, `/agenda`, `/pacientes`, `/odontologos`, `/historias-clinicas`, `/usuarios`, `/configuracion`, `/login` → plantillas Thymeleaf |
| API REST | `Controller.Rest` | `AuthRestController`, `UsuarioRestController`, `Paciente2RestController`, `OdontologoRestController`, `Cita2RestController`, `HistoriaClinicaRestController`, `TipoCitaRestController`, `RolRestController`, `AgendaRestController`, `CatalogoRestController` — CRUD JSON bajo `/api` |
| Lógica de negocio | `Service` + `Impl` | Interfaces (`UsuarioService`, `Cita2Service`, `AgendaService`, `EmailService`, …) e implementaciones (`UsuarioServiceImpl`, …). Ej.: `autenticar(identifier, password)` acepta email, username o documento; `AgendaService` calcula disponibilidad y valida turnos; `EmailService` envía correos de forma asíncrona |
| Tareas programadas | `Service` | `RecordatorioScheduler` — todos los días 07:00 envía recordatorios de las citas del día siguiente |
| Persistencia | `Repository` | `JpaRepository` por entidad: `UsuarioRepository`, `Paciente2Repository`, `OdontologoRepository`, `Cita2Repository`, `HistoriaClinicaRepository`, `TipoCitaRepository`, `RolRepository`, `BloqueoAgendaRepository` |
| Dominio | `Entity` | `Usuario`, `Rol`, `Paciente2`, `Odontologo`, `Cita2`, `HistoriaClinica`, `TipoCita`, `BloqueoAgenda`, enums `EstadoCitaEnum`, `TipoDocumento`, `Genero`, `Parentesco`, `TipoMovimientoAgenda` |
| Transferencia | `Dto` | `UsuarioDto`, `Paciente2Dto`, `OdontologoDto`, `Cita2Dto`, `HistoriaClinicaDto`, `TipoCitaDto`, `RolDto`, `LoginRequestDto`, `BloqueoAgendaDto`, `AgendaDiaDto`, `SlotAgendaDto` |
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
| Citas | `POST` | `/api/citas` | Crear (valida turno disponible en agenda; dispara correos si aplica) |
| Agenda | `GET` | `/api/agenda?odontologoId&anio&mes` | Matriz mensual de turnos (LIBRE/OCUPADO/BLOQUEADO) |
| Agenda | `GET` | `/api/agenda/dia?odontologoId&fecha` | Agenda de un día |
| Agenda | `GET/POST` | `/api/agenda/movimientos` | Listar / crear apertura o cierre (solo Administrador) |
| Agenda | `DELETE` | `/api/agenda/movimientos/{id}` | Eliminar movimiento (borrado lógico, solo Administrador) |
| Catálogos | `GET` | `/api/catalogos` | Tipos de documento, géneros, parentescos, estados de cita |
| Historias | `GET` | `/api/historias-clinicas`, `/api/historias-clinicas/{id}` | Listar / obtener (1 por paciente) |
| Historias | `POST` | `/api/historias-clinicas` | Crear |
| Tipos cita | `GET` | `/api/tipos-cita`, `/api/tipos-cita/{id}` | Listar / obtener |
| Tipos cita | `POST` | `/api/tipos-cita` | Crear |
| Roles | `GET` | `/api/roles`, `/api/roles/{id}` | Listar / obtener (1=Administrador, 2=Odontólogo, 3=Recepcionista) |
| Roles | `POST` | `/api/roles` | Crear |

Vistas MVC: `/`, `/dashboard` (home), `/inicio` (landing pública), `/login`, `/citas`, `/agenda` (solo Administrador), `/pacientes`, `/odontologos`, `/historias-clinicas`, `/usuarios`, `/configuracion`.

---

## 5. Funcionalidades del plan de acción

### 1. Agenda mensual del odontólogo (solo Administrador)
- Vista `/agenda` (`Agenda.html` + `agenda.js`): selector de odontólogo y mes, calendario con conteos por día (libres/ocupados/cerrado/no laborable), detalle de turnos por día y tabla de aperturas/cierres del mes.
- Los turnos se derivan del horario base del odontólogo (`diasTrabajo`, `horaInicio`, `horaFin`) en bloques de 30 min (`AgendaServiceImpl.DURACION_TURNO_MINUTOS`; pendiente definir duración por procedimiento al finalizar).
- Modo mixto: el Administrador crea **cierres** (`BLOQUEO`: día completo o rango horario, ej. vacaciones) y **aperturas extra** (`APERTURA_EXTRA`: habilitar días/horas fuera del horario base) desde el modal "Apertura / Cierre".
- Al crear/editar una cita el backend valida que el turno esté abierto y libre (`validarTurnoDisponible`); si no, rechaza con error.
- Seguridad: enlace "Agenda Médica" oculto a no-admin (`user-session.js` + `data-require-admin`) y `Agenda.html` redirige a `/dashboard` si la sesión no es Administrador.

### 2. Correos de confirmación y recordatorio (Gmail SMTP)
- Al asignar una cita se envían (asíncronos, nunca bloquean la creación):
  1. **Confirmación al paciente** (`templates/email/confirmacion-cita.html`) si tiene email y el checkbox "Enviar confirmación y recordatorio" está marcado.
  2. **Copia informativa al usuario que agenda** (`templates/email/recordatorio-cita.html`) usando el email de la sesión, para no olvidar la cita.
- Job diario 07:00 (`RecordatorioScheduler`): recordatorio de las citas de mañana (`PENDIENTE`/`CONFIRMADA`), marcado con `citas.recordatorio_enviado` para no duplicar.
- **Paso final para activar** (credenciales pendientes): en `odontologia/src/main/resources/application.properties` descomentar el bloque `spring.mail.*`, colocar la cuenta Gmail, la **contraseña de aplicación** (Google > Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones) y `app.mail.from`, y poner `app.mail.enabled=true`. Sin esto, el sistema funciona igual pero solo registra en log.

### 3. Impresión del comprobante de cita
- Al crear una cita, el diálogo de éxito ofrece **"Imprimir comprobante"**; el modal de detalle conserva su botón **Imprimir**.
- El comprobante (`#comprobanteCita` en `citas.html`: folio, paciente, fecha/hora, tipo, odontólogo, consultorio, estado, motivo, firmas) solo aparece en papel gracias a `@media print` en `app.css` (`window.print()` desde `printAppointment()` / `printCitaById()`).

### 4. Enums vs tablas
- **Enums nuevos** (`Entity/`): `TipoDocumento` (CC, CE, TI, PP, PA, RC), `Genero` (M, F, O), `Parentesco` (catálogo + texto libre como "Otro"). Se validan/normalizan en `Paciente2ServiceImpl`, `OdontologoServiceImpl`, `UsuarioServiceImpl`; la columna sigue `VARCHAR` para no romper datos históricos (normalización idempotente en `base.sql`).
- **Se mantiene como tabla**: `TipoCita` (catálogo administrable vía `/api/tipos-cita`).
- Fuente única frontend: `GET /api/catalogos` + `static/js/catalogos.js` (con fallback local); selects de tipo de documento unificados y parentesco con sugerencias (`datalist`) en Pacientes y Odontólogos. Se corrigió la inconsistencia `PA` vs `PP`.

---

## 6. Requisitos previos

- **Java 21** (`java -version`)
- **Maven 3.9+** (o usar `./mvnw` incluido)
- **PostgreSQL 14+** corriendo en `localhost:5432`

---

## 7. Instalación y ejecución

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

### Activar el envío de correos (paso final)
1. Generar una **contraseña de aplicación** de Gmail (Cuenta Google > Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones).
2. En `odontologia/src/main/resources/application.properties`, descomentar el bloque `spring.mail.*`, colocar cuenta, App Password y `app.mail.from`, y poner `app.mail.enabled=true`.
3. Reiniciar la app. Sin este paso, las citas se crean normalmente pero los correos solo se registran en log.

> La agenda médica (`/agenda`) solo es visible y operable por el rol **Administrador**.

---

## 8. Notas técnicas y deuda conocida

- Las contraseñas se guardan y comparan **en texto plano** (`UsuarioServiceImpl` + `base.sql`). Pendiente migrar a **BCrypt + Spring Security / JWT**.
- Sin validación Bean Validation global ni manejo centralizado de excepciones (`@ControllerAdvice`).
- `application.properties` con credenciales de desarrollo hardcodeadas — externalizar vía variables de entorno en producción.
- El frontend no usa framework SPA; la protección de rutas es solo cliente (`auth-guard.js`).

---

## 9. Roadmap sugerido

1. Spring Security + BCrypt + JWT.
2. CRUD completo (PUT/DELETE) en todos los RestControllers.
3. Paginación/filtros server-side y validaciones.
4. `docker-compose.yml` (app + postgres) y perfiles `dev/prod`.
5. Pruebas de integración (Testcontainers) y CI.
