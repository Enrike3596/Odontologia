# Sistema de Gestión Odontológica 🦷

Sistema web para la gestión integral de una clínica odontológica: administración de **usuarios, pacientes, odontólogos, citas, agenda médica mensual, historias clínicas, tipos de cita y roles**, con autenticación por email/usuario/documento (**Spring Security + hash BCrypt + sesión en servidor + recuperación por correo**), **envío de correos de confirmación/recordatorio vía Gmail SMTP** e **impresión del comprobante de cita**.

---

## 1. Tecnologías utilizadas

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| **Java** | 21 | Lenguaje principal |
| **Spring Boot** | 3.5.6 | Framework base (parent `spring-boot-starter-parent`) |
| **Spring Web (MVC + REST)** | — | Controladores MVC (`VistaController`) y API REST (`/api/**`) |
| **Spring Security** | — | Sesión HTTP del lado servidor, reglas por rol (`/api/agenda/movimientos` solo Administrador), 401/403 JSON en API y redirección a `/login` en vistas. `PasswordEncoder` BCrypt (costo 12) |
| **Spring Data JPA / Hibernate** | — | Persistencia, entidades y repositorios. `ddl-auto=update` |
| **Spring Mail (SMTP)** | — | Confirmación y recordatorio de citas por correo (Gmail/Workspace, `app.mail.enabled`) |
| **Thymeleaf** | — | Renderizado server-side de vistas (`src/main/resources/templates/`) + plantillas de correo (`templates/email/`) |
| **Spring Actuator** | — | Monitoreo y health checks |
| **Spring DevTools** | — | Recarga en caliente en desarrollo |
| **Lombok** | — | Reducción de boilerplate (`@Data`, `@Entity`, DTOs) |
| **PostgreSQL Driver** | runtime | Conexión JDBC a PostgreSQL |
| **Maven** | — | Gestión de dependencias y build (`pom.xml`, `mvnw` / `mvnw.cmd`) |
| **JUnit / spring-boot-starter-test** | — | Pruebas (`OdontologiaApplicationTests`, `UsuarioPasswordSecurityTest`: hash BCrypt, política de clave, migración legada, recuperación) |

### Frontend
| Tecnología | Uso |
|---|---|
| **Thymeleaf + HTML5** | Vistas: `home.html`, `login.html`, `citas.html`, `Agenda.html`, `Pacientes.html`, `Odontologos.html`, `HistoriasClinicas.html`, `Usuarios.html`, `configuracion.html`, `Pagina inicial/index.html`, `email/confirmacion-cita.html`, `email/recordatorio-cita.html`, `email/recuperacion.html` |
| **JavaScript vanilla (Fetch API)** | Lógica por módulo: `login.js`, `citas.js`, `agenda.js`, `catalogos.js`, `pacientes.js`, `odontologos.js`, `historiaclinica.js`, `usuarios.js`, `home.js`, `navigation.js`, `sidebar.js`, `components.js`, `auth-guard.js`, `user-session.js`, `table-pager.js`, `contacto.js` |
| **CSS propio (`app.css`) + Bootstrap 5.0.5-alpha** | Estilos del panel administrativo y de la página pública inicial |
| **LineIcons 2.0, animate.css, tiny-slider, wow.js** | Iconos, animaciones y slider de la landing page (`Pagina Inicial/`) |
| **Componentes reutilizables** | `static/Components/sidebar.html` y `topbar.html` cargados vía JS |

### Base de datos
| Tecnología | Detalle |
|---|---|
| **PostgreSQL 5432** | BD `odontologia` (ver `odontologia/base.sql`) |
| Tablas | `roles`, `usuarios`, `pacientes`, `odontologos`, `tipos_cita`, `historias_clinicas`, `citas`, `bloqueos_agenda`, `password_reset_tokens` |
| Script base | `odontologia/base.sql` — re-ejecutable, crea tablas + datos semilla (3 roles, usuario admin, 5 pacientes, 3 odontólogos, 4 tipos de cita, 2 citas) + normalización de catálogos |

> Credencial inicial: `admin@clinica.com` / `admin` / `admin123`. La clave en plano migra a hash BCrypt al primer ingreso; **cámbiela de inmediato** en el módulo Usuarios (mín. 10 caracteres con mayúscula, minúscula y número).

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
| Dominio | `Entity` | `Usuario`, `Rol`, `Paciente2`, `Odontologo`, `Cita2`, `HistoriaClinica`, `TipoCita`, `BloqueoAgenda`, `PasswordResetToken`, enums `EstadoCitaEnum`, `TipoDocumento`, `Genero`, `Parentesco`, `TipoMovimientoAgenda` |
| Transferencia | `Dto` | `UsuarioDto`, `Paciente2Dto`, `OdontologoDto`, `Cita2Dto`, `HistoriaClinicaDto`, `TipoCitaDto`, `RolDto`, `LoginRequestDto`, `BloqueoAgendaDto`, `AgendaDiaDto`, `SlotAgendaDto` |
| Configuración | `Config` | `SecurityConfig` (filter chain + `PasswordEncoder` BCrypt), `Roles` (mapeo rol→authority), `AuthPrincipal` (identidad de sesión), `LoginAttemptService` (límite de intentos), `WebCacheConfig` (caché de recursos estáticos) |

### Patrones
- **MVC server-side** (Thymeleaf) para las páginas + **REST + AJAX** (JS `fetch`) para los datos — sin SPA framework.
- **DTO** para desacoplar entidades JPA del JSON/vistas.
- **Repository + Service Interface/Impl** (inyección con `@Autowired`).
- **Sesión en servidor** (Spring Security + `JSESSIONID` HttpOnly/SameSite): el `localStorage` (`auth-guard.js`, `user-session.js`) es solo caché de UI; la validez se verifica contra `GET /api/auth/me`. Sin sesión: API → 401 JSON, vistas → redirect a `/login`.

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
  │   │   ├── Config/        → SecurityConfig, Roles, AuthPrincipal,
  │   │   │                    LoginAttemptService, WebCacheConfig
        │   │   ├── Controller/
        │   │   │   ├── Mvc/       → VistaController
        │   │   │   └── Rest/      → Auth, Usuario, Paciente2, Odontologo,
        │   │   │                    Cita2, HistoriaClinica, TipoCita, Rol
        │   │   ├── Dto/           → *Dto, LoginRequestDto
  │   │   ├── Entity/        → Usuario, Rol, Paciente2, Odontologo,
  │   │   │                    Cita2, HistoriaClinica, TipoCita, EstadoCitaEnum,
  │   │   │                    PasswordResetToken
  │   │   ├── Repository/    → JpaRepositories (+ PasswordResetTokenRepository)
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
        └── test/          → OdontologiaApplicationTests, UsuarioPasswordSecurityTest
```

---

## 4. API REST — endpoints

Base: `http://localhost:8080/api`

| Módulo | Método | Ruta | Descripción |
|---|---|---|---|
| Auth | `POST` | `/api/auth/login` | Login con `{ identifier, password }` (email, username o documento). Crea sesión servidor. `200` + `UsuarioDto`, `400` faltantes, `401` credenciales inválidas, `403` usuario inactivo, `429` por exceso de intentos (5 fallos / 15 min) |
| Auth | `GET` | `/api/auth/me` | Sesión actual (fuente de verdad del guardia frontend). `200` + `UsuarioDto`, `401` sin sesión |
| Auth | `POST` | `/api/auth/logout` | Invalida la sesión del servidor |
| Auth | `POST` | `/api/auth/recovery` | Solicita código de 6 dígitos al correo (`{ identifier }`; respuesta genérica anti-enumeración; vigencia 15 min) |
| Auth | `POST` | `/api/auth/reset` | Canjea `{ codigo, nuevaPassword }` (aplica política de clave, uso único) |
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

## 6. Seguridad — inicio de sesión fortalecido

### 6.1 Contraseñas con hash BCrypt (nunca en plano)
- `PasswordEncoder` BCrypt costo 12 (`Config/SecurityConfig`); columna `usuarios.password` en `VARCHAR(255)`.
- Crear/actualizar/restablecer siempre guardan el hash (`UsuarioServiceImpl.codificarPassword`); el DTO de respuesta nunca incluye la clave.
- **Migración transparente**: los valores legados en plano se verifican una vez y se **re-hashean al entrar**; con clave errónea no hay migración.
- **Procedimiento en BD**: no requiere script — al primer login de cada usuario su fila queda con `$2b$...` (60 caracteres). Verificable con `SELECT id, username, length(password), left(password,4) FROM usuarios;`.

### 6.2 Política de contraseñas
- Mínimo **10 caracteres con mayúscula, minúscula y número**. Se exige en backend (`validarPoliticaPassword`) al crear, actualizar y restablecer; el frontend la refleja en `usuarios.js` y `login.js`.
- Se eliminó la clave temporal `temp123`: crear usuario sin contraseña ahora es error.

### 6.3 Sesión en servidor + autorización por rol
- Login exitoso crea sesión HTTP (`JSESSIONID` HttpOnly + `SameSite=Lax`, expira a los 30 min de inactividad; `changeSessionId` anti-fijación).
- Reglas (`SecurityConfig`): `/api/auth/**` público; `/api/**` exige sesión; `POST/DELETE /api/agenda/movimientos` exige rol **Administrador** (mapeo en `Config/Roles`).
- Sin sesión: API → `401` JSON, vistas → redirect a `/login`. Sin rol: API → `403` JSON.
- `auth-guard.js` valida contra `GET /api/auth/me`; `ClinicaAuth.logout()` invalida en servidor (`POST /api/auth/logout`); los 8 `logout()` de las plantillas lo usan.
- **Límite de intentos** (`LoginAttemptService`, en memoria): 5 fallos por identificador+IP en 15 min → `429` con tiempo de reintento; el éxito limpia el contador.

### 6.4 Recuperación de cuenta real (antes simulada)
- Flujo en 2 pasos en `login.html`/`login.js`: `POST /api/auth/recovery` → código de **6 dígitos por correo** (`templates/email/recuperacion.html`, 15 min de vigencia) → `POST /api/auth/reset` con código + clave nueva.
- En BD (`password_reset_tokens`) solo se guarda el **SHA-256** del código, con marca de uso único; purga diaria de vencidos (`purgarCodigosVencidos`, 03:00).
- Respuestas genéricas para no revelar si la cuenta existe; la recuperación también está bajo límite de intentos.
- **Quitado**: botón "FaceID/Huella" (entraba sin credenciales con sesión recordada) y opciones WhatsApp/SMS sin infraestructura.

---

## 7. Requisitos previos

- **Java 21** (`java -version`)
- **Maven 3.9+** (o usar `./mvnw` incluido)
- **PostgreSQL 14+** corriendo en `localhost:5432`

---

## 8. Instalación y ejecución

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

## 9. Notas técnicas y deuda conocida

- Sin validación Bean Validation global ni manejo centralizado de excepciones (`@ControllerAdvice`).
- `application.properties` con credenciales de desarrollo hardcodeadas — externalizar vía variables de entorno en producción (incluye la App Password de Gmail).
- CSRF por token desactivado para `/api/**` (app misma-origen + cookie `SameSite=Lax`); reevaluar si se expone cross-origin.
- El límite de intentos es en memoria (se reinicia al replegar; para multi-instancia usar Redis/Bucket4j).

---

## 10. Roadmap sugerido

1. ~~Spring Security + BCrypt + JWT~~ ✅ Hecho (sesión servidor + BCrypt; JWT queda opcional).
2. CRUD completo (PUT/DELETE) en todos los RestControllers.
3. Paginación/filtros server-side y validaciones.
4. `docker-compose.yml` (app + postgres) y perfiles `dev/prod`.
5. Pruebas de integración (Testcontainers) y CI.
