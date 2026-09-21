/**
 * Sistema de Gestión de Citas Médicas - Clínica Odontológica
 * Funcionalidades CRUD para citas con validaciones médicas y SweetAlert2
 */

// Estado global del módulo de citas
const AppointmentsModule = {
    currentAppointment: null,
    // Caché de la lista para abrir ver/editar al instante (sin loader)
    cachedCitas: [],
    // Caché de odontólogos y tipos para el filtrado por especialidad
    cachedOdontologos: [],
    cachedTiposCita: [],
    editMode: false,
    editingAppointmentId: null,
    filters: {
        search: '',
        estado: '',
        odontologo: '',
        fecha: ''
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: TablePager.DEFAULT_PAGE_SIZE,
        totalItems: 0
    },
    appointmentStatuses: [
        { id: 'PENDIENTE', name: 'Pendiente', color: 'yellow' },
        { id: 'CONFIRMADA', name: 'Confirmada', color: 'green' },
        { id: 'REPROGRAMADA', name: 'Reprogramada', color: 'purple' },
        { id: 'FINALIZADA', name: 'Finalizada', color: 'blue' },
        { id: 'NO_ASISTIDA', name: 'No asistida', color: 'gray' },
        { id: 'CANCELADA', name: 'Cancelada', color: 'red' }
    ],
    appointmentTypes: [
        { id: 'consulta-general', name: 'Consulta General', icon: 'fa-stethoscope', color: 'blue' },
        { id: 'limpieza', name: 'Limpieza Dental', icon: 'fa-tooth', color: 'green' },
        { id: 'endodoncia', name: 'Endodoncia', icon: 'fa-procedures', color: 'red' },
        { id: 'cirugia', name: 'Cirugía Oral', icon: 'fa-cut', color: 'purple' },
        { id: 'ortodoncia', name: 'Ortodoncia', icon: 'fa-smile', color: 'indigo' },
        { id: 'periodoncia', name: 'Periodoncia', icon: 'fa-heart', color: 'pink' },
        { id: 'estetica', name: 'Odontología Estética', icon: 'fa-star', color: 'yellow' },
        { id: 'urgencia', name: 'Urgencia', icon: 'fa-exclamation-triangle', color: 'red' }
    ],
    currentDate: new Date(),
    apiBaseUrl: '/api'
};

// API Functions para comunicación con el backend
const CitasAPI = {
    // Obtener todas las citas
    async getAllCitas() {
        try {
            const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas`);
            if (!response.ok) throw new Error('Error al cargar las citas');
            return await response.json();
        } catch (error) {
            console.error('Error en getAllCitas:', error);
            throw error;
        }
    },

    // Obtener cita por ID
    async getCitaById(id) {
        try {
            console.log(`Obteniendo cita con ID: ${id}`);
            const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas/${id}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error HTTP ${response.status}:`, errorText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Datos de cita obtenidos:', data);
            return data;
        } catch (error) {
            console.error('Error en getCitaById:', error);
            throw error;
        }
    },

    // Agenda real de un odontólogo en una fecha (turnos LIBRE/OCUPADO/BLOQUEADO)
    async getAgendaDia(odontologoId, fecha) {
        const response = await fetch(`${AppointmentsModule.apiBaseUrl}/agenda/dia?odontologoId=${encodeURIComponent(odontologoId)}&fecha=${encodeURIComponent(fecha)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(extraerMensajeBackend(errorText) || 'No se pudo cargar la agenda del odontólogo');
        }
        return await response.json();
    },

    // Agenda mensual de un odontólogo (días laborables + turnos del mes)
    async getAgendaMensual(odontologoId, anio, mes) {
        const response = await fetch(`${AppointmentsModule.apiBaseUrl}/agenda?odontologoId=${encodeURIComponent(odontologoId)}&anio=${anio}&mes=${mes}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(extraerMensajeBackend(errorText) || 'No se pudo cargar la agenda mensual del odontólogo');
        }
        return await response.json();
    },

    // Crear nueva cita
    async createCita(citaData) {
        try {
            console.log('Enviando datos de cita:', citaData);

            const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(citaData)
            });

            console.log('Respuesta del servidor:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error del servidor:', errorText);
                throw new Error(extraerMensajeBackend(errorText) || `Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Cita creada exitosamente:', result);
            return result;
        } catch (error) {
            console.error('Error en createCita:', error);
            throw error;
        }
    },

    // Actualizar cita
    async updateCita(id, citaData) {
        try {
            console.log(`Actualizando cita ID ${id} con datos:`, citaData);
            const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(citaData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error HTTP ${response.status}:`, errorText);
                throw new Error(extraerMensajeBackend(errorText) || `Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Cita actualizada exitosamente:', result);
            return result;
        } catch (error) {
            console.error('Error en updateCita:', error);
            throw error;
        }
    },

    // Eliminar cita
    async deleteCita(id) {
        try {
            const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(extraerMensajeBackend(errorText) || 'Error al eliminar la cita');
            }
            return true;
        } catch (error) {
            console.error('Error en deleteCita:', error);
            throw error;
        }
    },

    // Confirmar cita: solo el mismo día, antes de la hora (no envía correos)
    async confirmarCita(id) {
        const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas/${id}/confirmar`, {
            method: 'POST'
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(extraerMensajeBackend(errorText) || 'No se pudo confirmar la cita');
        }
        return await response.json();
    },

    // Recordatorio de cita por correo: solo un día antes (no cambia el estado)
    async enviarRecordatorio(id) {
        const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas/${id}/recordatorio`, {
            method: 'POST'
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(extraerMensajeBackend(errorText) || 'No se pudo enviar el recordatorio');
        }
        return await response.json();
    },

    // Finalizar cita: la realiza el odontólogo asignado, después de la atención
    async finalizarCita(id, odontologoId) {
        const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas/${id}/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(odontologoId ? { odontologoId } : {})
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(extraerMensajeBackend(errorText) || 'No se pudo finalizar la cita');
        }
        return await response.json();
    },

    // NOTA: NO_ASISTIDA la marca automáticamente el sistema 1 minuto después
    // de la fecha/hora asignada. No existe marcado manual.

    // Buscar paciente por cédula/documento
    async getPacientePorDocumento(documento) {
        const response = await fetch(`${AppointmentsModule.apiBaseUrl}/pacientes/documento/${encodeURIComponent(documento)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Paciente no encontrado');
        }
        return await response.json();
    },

    // Odontólogos por especialidad (tipo de cita = especialidad)
    async getOdontologosPorEspecialidad(especialidad) {
        const response = await fetch(`${AppointmentsModule.apiBaseUrl}/odontologos/por-especialidad?especialidad=${encodeURIComponent(especialidad)}`);
        if (!response.ok) throw new Error('Error al filtrar odontólogos por especialidad');
        return await response.json();
    }
};

/**
 * Extrae el mensaje legible del backend sin exponer el trace del 500.
 * El backend de citas devuelve {message: "..."} en 409; los errores
 * antiguos de Spring devuelven {message, trace, ...}. Se prioriza message.
 */
function extraerMensajeBackend(raw) {
    if (!raw) return '';
    try {
        const obj = JSON.parse(raw);
        if (obj && obj.message) return String(obj.message).slice(0, 500);
        if (obj && obj.error) return String(obj.error).slice(0, 500);
    } catch (e) { /* no es JSON */ }
    // Si es HTML de error de Spring/Tomcat, no mostrarlo crudo
    if (/<html|<!doctype/i.test(raw)) return '';
    return String(raw).slice(0, 500);
}

/** Horas base del formulario (respaldo cuando aún no hay odontólogo/fecha). */
const HORAS_BASE_CITAS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

function pintarHorasCita(horas, valorSeleccionado) {
    const select = document.getElementById('horaCita');
    if (!select) return;
    const actual = valorSeleccionado !== undefined ? valorSeleccionado : select.value;
    select.innerHTML = '<option value="">Seleccionar hora...</option>';
    horas.forEach(function (h) {
        const option = document.createElement('option');
        option.value = h;
        option.textContent = formatearHora12(h);
        select.appendChild(option);
    });
    if (actual && horas.includes(actual)) select.value = actual;
}

function formatearHora12(hhmm) {
    const parts = String(hhmm || '').split(':');
    if (parts.length < 2) return hhmm;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return String(dh).padStart(2, '0') + ':' + m + ' ' + period;
}

function mostrarHintAgenda(texto, esError) {
    let hint = document.getElementById('horaCitaHint');
    if (!hint) {
        const select = document.getElementById('horaCita');
        if (!select || !select.parentElement) return;
        hint = document.createElement('p');
        hint.id = 'horaCitaHint';
        hint.className = 'text-xs mt-1';
        select.parentElement.appendChild(hint);
    }
    hint.textContent = texto || '';
    hint.classList.toggle('text-red-600', !!esError);
    hint.classList.toggle('text-gray-500', !esError);
}

/**
 * Recarga el select de horas con los turnos LIBRE de la agenda real
 * del odontólogo en la fecha elegida. Evita el 409 antes de enviar.
 * Devuelve la lista de horas libres.
 */
async function actualizarHorasDisponibles(preservarSeleccion) {
    const odoSelect = document.getElementById('odontologoId');
    const fechaInput = document.getElementById('fechaCita');
    const odontologoId = odoSelect?.value || '';
    const fecha = fechaInput?.value || '';
    if (!odontologoId || !fecha) {
        if (preservarSeleccion !== false) pintarHorasCita(HORAS_BASE_CITAS);
        mostrarHintAgenda('Seleccione odontólogo y fecha para ver los turnos libres de su agenda.', false);
        return [];
    }
    try {
        mostrarHintAgenda('Cargando turnos libres de la agenda...', false);
        const dia = await CitasAPI.getAgendaDia(odontologoId, fecha);
        const libres = (dia.turnos || []).filter(t => t.estado === 'LIBRE').map(t => String(t.hora).slice(0, 5));
        if (libres.length === 0) {
            pintarHorasCita([], '');
            const motivo = dia.laborable === false
                ? `El odontólogo no labora el ${fecha} (${dia.diaSemana || ''}). Elija otro día o pida una apertura extra en Agenda Médica.`
                : `Sin turnos libres el ${fecha} (ocupados o bloqueados). Elija otra fecha u odontólogo.`;
            mostrarHintAgenda(motivo, true);
            return [];
        }
        pintarHorasCita(libres);
        mostrarHintAgenda(`${libres.length} turno(s) libres en la agenda del odontólogo para el ${fecha}.`, false);
        return libres;
    } catch (e) {
        console.warn('No se pudo cargar la agenda, se conserva el horario base:', e);
        pintarHorasCita(HORAS_BASE_CITAS);
        mostrarHintAgenda('No se pudo cargar la agenda en línea; verifique la hora antes de agendar.', true);
        return [];
    }
}

/* =====================================================================
 * Mini-calendario de fecha adaptado a la agenda del odontólogo elegido.
 * Solo habilita los días que el médico labora (con turnos libres);
 * los demás aparecen deshabilitados. Usa GET /api/agenda mensual.
 * ===================================================================== */
const CalendarioCita = {
    odoId: '',
    anio: 0,
    mes: 0,
    editingId: null,
    cache: {} // "odoId-anio-mes" -> { porFecha: {...} } | { error: true }
};

const CAL_CITA_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const CAL_CITA_DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const CAL_CITA_DIAS_ORDEN = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const CAL_CITA_DIAS_CORTO = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom' };

function calCitaSinTildes(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Odontólogo seleccionado, buscado en la caché del módulo. */
function calCitaOdontologo() {
    const id = String(document.getElementById('odontologoId')?.value || '');
    if (!id) return null;
    return (AppointmentsModule.cachedOdontologos || []).find(o => String(o.id) === id) || { id };
}

/** Etiqueta legible de los días de trabajo ("Lun, Mié, Vie" o el texto original). */
function calCitaEtiquetaDias(diasTrabajo) {
    const txt = String(diasTrabajo || '').trim();
    if (!txt) return '';
    const encontrados = CAL_CITA_DIAS_ORDEN.filter(d => calCitaSinTildes(txt).includes(d));
    if (encontrados.length > 0 && encontrados.length < 7) {
        return encontrados.map(d => CAL_CITA_DIAS_CORTO[d]).join(', ');
    }
    if (encontrados.length === 7) return 'Lun a Dom';
    return txt.length > 60 ? txt.slice(0, 60) + '…' : txt;
}

/** Hint bajo la fecha con los días que atiende el odontólogo elegido. */
function actualizarHintDias() {
    const hint = document.getElementById('fechaCitaHint');
    const input = document.getElementById('fechaCita');
    const odo = calCitaOdontologo();
    if (!odo) {
        if (hint) hint.textContent = 'Seleccione primero el odontólogo para ver sus días disponibles.';
        if (input && !input.value) input.placeholder = 'Seleccione el odontólogo...';
        return;
    }
    const etiqueta = calCitaEtiquetaDias(odo.diasTrabajo);
    if (hint) {
        hint.textContent = etiqueta
            ? `El odontólogo atiende: ${etiqueta}. Solo esos días están disponibles en el calendario.`
            : 'El odontólogo no tiene horario base registrado: solo días con apertura extra.';
    }
    if (input && !input.value) input.placeholder = 'Clic para elegir fecha...';
}

/** Al cambiar el odontólogo: refresca hint, valida la fecha elegida y recarga turnos. */
async function onOdontologoChangeAgenda() {
    actualizarHintDias();
    const input = document.getElementById('fechaCita');
    const odoId = String(document.getElementById('odontologoId')?.value || '');
    CalendarioCita.odoId = odoId;
    CalendarioCita.cache = {};
    if (input && input.value && odoId) {
        // Si la fecha elegida no es laborable para el nuevo odontólogo, se limpia
        try {
            const dia = await CitasAPI.getAgendaDia(odoId, input.value.slice(0, 10));
            const turnos = dia.turnos || [];
            if (!dia.laborable && turnos.length === 0) {
                input.value = '';
                input.placeholder = 'Clic para elegir fecha...';
                Swal.fire({
                    icon: 'info',
                    title: 'Fecha no disponible',
                    text: `El odontólogo no labora el día elegido (${dia.diaSemana || ''}). Elija uno de sus días de atención.`,
                    confirmButtonColor: '#3b82f6'
                });
            }
        } catch (e) { /* si falla la agenda, se conserva la fecha y decide el backend */ }
    }
    if (CalendarioCita.abierto) renderCalendarioCita();
    await actualizarHorasDisponibles();
}

/** Agenda mensual cacheada por odontólogo+mes. */
async function calCitaMes(odoId, anio, mes) {
    const key = `${odoId}-${anio}-${mes}`;
    if (CalendarioCita.cache[key]) return CalendarioCita.cache[key];
    try {
        const dias = await CitasAPI.getAgendaMensual(odoId, anio, mes);
        const porFecha = {};
        (Array.isArray(dias) ? dias : []).forEach(d => {
            const f = String(d.fecha || '').slice(0, 10);
            if (/^\d{4}-\d{2}-\d{2}$/.test(f)) porFecha[f] = d;
        });
        CalendarioCita.cache[key] = { porFecha };
    } catch (e) {
        CalendarioCita.cache[key] = { error: true, porFecha: {} };
    }
    return CalendarioCita.cache[key];
}

/** Disponibilidad de un día: laborable (o con apertura extra) y con turnos libres. */
function calCitaDisponibilidad(dia) {
    const turnos = (dia && dia.turnos) || [];
    if (!dia || (!dia.laborable && turnos.length === 0)) {
        return { ok: false, motivo: 'El odontólogo no labora este día' };
    }
    const editingId = CalendarioCita.editingId;
    const libres = turnos.filter(t => t.estado === 'LIBRE'
        || (t.estado === 'OCUPADO' && editingId && String(t.citaId) === String(editingId)));
    if (turnos.length > 0 && libres.length === 0) {
        return { ok: false, motivo: 'Día completo (sin turnos libres)', lleno: true };
    }
    return { ok: true, libres: libres.length };
}

function calCitaAbrir() {
    const odoId = String(document.getElementById('odontologoId')?.value || '');
    if (!odoId) {
        Swal.fire({
            icon: 'info',
            title: 'Seleccione el odontólogo',
            text: 'Primero elija el odontólogo: el calendario muestra solo los días que labora.',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }
    CalendarioCita.odoId = odoId;
    const input = document.getElementById('fechaCita');
    const base = (input && /^\d{4}-\d{2}-\d{2}$/.test(input.value.slice(0, 10)))
        ? input.value.slice(0, 10) : claveFechaLocal(new Date());
    CalendarioCita.anio = parseInt(base.slice(0, 4), 10);
    CalendarioCita.mes = parseInt(base.slice(5, 7), 10);
    CalendarioCita.abierto = true;
    const panel = document.getElementById('calendarioCitaPanel');
    if (panel) panel.classList.remove('hidden');
    renderCalendarioCita();
}

function cerrarCalendarioCita() {
    CalendarioCita.abierto = false;
    const panel = document.getElementById('calendarioCitaPanel');
    if (panel) panel.classList.add('hidden');
}

function calCitaCambiarMes(delta) {
    let { anio, mes } = CalendarioCita;
    mes += delta;
    if (mes < 1) { mes = 12; anio -= 1; }
    if (mes > 12) { mes = 1; anio += 1; }
    const hoy = new Date();
    const minKey = hoy.getFullYear() * 12 + hoy.getMonth();
    const maxKey = minKey + 11;
    const key = anio * 12 + (mes - 1);
    if (key < minKey || key > maxKey) return;
    CalendarioCita.anio = anio;
    CalendarioCita.mes = mes;
    renderCalendarioCita();
}

async function renderCalendarioCita() {
    const panel = document.getElementById('calendarioCitaPanel');
    if (!panel || !CalendarioCita.abierto) return;
    const { anio, mes, odoId } = CalendarioCita;
    const hoyStr = claveFechaLocal(new Date());
    const selStr = String(document.getElementById('fechaCita')?.value || '').slice(0, 10);
    panel.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <button type="button" onclick="calCitaCambiarMes(-1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" aria-label="Mes anterior"><i class="fas fa-chevron-left text-xs"></i></button>
            <span class="text-sm font-semibold text-gray-800">${CAL_CITA_MESES[mes - 1]} ${anio}</span>
            <button type="button" onclick="calCitaCambiarMes(1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" aria-label="Mes siguiente"><i class="fas fa-chevron-right text-xs"></i></button>
        </div>
        <div class="cal-cita-grid mb-1">${CAL_CITA_DOW.map(d => `<span class="cal-cita-dow">${d}</span>`).join('')}</div>
        <div class="cal-cita-grid" id="calCitaDias"><span class="col-span-7 text-center text-xs text-gray-400 py-3">Cargando agenda...</span></div>
        <p class="text-[11px] text-gray-500 mt-2"><span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Disponible
        <span class="inline-block w-2 h-2 rounded-full bg-amber-200 ml-2 mr-1"></span>Completo
        <span class="inline-block w-2 h-2 rounded-full bg-gray-200 ml-2 mr-1"></span>No labora</p>`;
    const mesData = await calCitaMes(odoId, anio, mes);
    if (!CalendarioCita.abierto || CalendarioCita.anio !== anio || CalendarioCita.mes !== mes) return;
    const grid = document.getElementById('calCitaDias');
    if (!grid) return;
    const primerOffset = (new Date(anio, mes - 1, 1).getDay() + 6) % 7; // lunes primero
    const diasMes = new Date(anio, mes, 0).getDate();
    let html = '';
    for (let i = 0; i < primerOffset; i++) html += '<span></span>';
    for (let d = 1; d <= diasMes; d++) {
        const f = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const pasada = f < hoyStr;
        const esSel = f === selStr;
        if (pasada) {
            html += `<span class="cal-cita-day cal-cita-day-off" title="Fecha pasada">${d}</span>`;
            continue;
        }
        if (mesData.error) {
            html += `<button type="button" onclick="elegirFechaCita('${f}')" class="cal-cita-day cal-cita-day-ok ${esSel ? 'cal-cita-day-sel' : ''}" title="Elegir ${f}">${d}</button>`;
            continue;
        }
        const disp = calCitaDisponibilidad(mesData.porFecha[f]);
        if (!disp.ok) {
            const cls = disp.lleno ? 'cal-cita-day-full' : 'cal-cita-day-off';
            html += `<span class="cal-cita-day ${cls}" title="${disp.motivo}">${d}</span>`;
        } else {
            html += `<button type="button" onclick="elegirFechaCita('${f}')" class="cal-cita-day cal-cita-day-ok ${esSel ? 'cal-cita-day-sel' : ''}" title="Elegir ${f} (${disp.libres} turno(s) libres)">${d}</button>`;
        }
    }
    grid.innerHTML = html;
    if (mesData.error) {
        const hint = document.getElementById('fechaCitaHint');
        if (hint) hint.textContent = 'No se pudo cargar la agenda del mes; verifique el día antes de agendar.';
    }
}

/** El usuario elige un día laborable del calendario del odontólogo. */
function elegirFechaCita(fechaStr) {
    const input = document.getElementById('fechaCita');
    if (input) {
        input.value = fechaStr;
        input.placeholder = fechaStr;
    }
    cerrarCalendarioCita();
    actualizarHorasDisponibles();
}

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.dataset.page === 'citas') {
        initializeAppointmentsModule();
    }
});

/**
 * Inicializa el módulo de citas médicas
 */
function initializeAppointmentsModule() {
    console.log('📅🦷 Inicializando módulo de citas médicas');

    // Configurar eventos
    setupEventListeners();

    // Cargar datos iniciales
    loadAppointments();

    // Configurar filtros
    setupFilters();

    // Actualizar fecha actual
    updateCurrentDate();

    // Mostrar mensaje de bienvenida
    showWelcomeMessage();
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Formulario de nueva cita
    const newAppointmentForm = document.getElementById('newAppointmentForm');
    if (newAppointmentForm) {
        newAppointmentForm.addEventListener('submit', handleNewAppointmentSubmit);
    }

    // Filtros en tiempo real
    const searchInput = document.querySelector('#filtersSection input[type="text"]');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearchInput, 300));
    }

    // Búsqueda de paciente por cédula con Enter
    const cedulaInput = document.getElementById('cedulaPaciente');
    if (cedulaInput && !cedulaInput.dataset.bound) {
        cedulaInput.dataset.bound = '1';
        cedulaInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarPacientePorCedula();
            }
        });
    }

    // Al cambiar odontólogo: validar fecha contra su agenda y recargar turnos libres
    const odoSel = document.getElementById('odontologoId');
    if (odoSel && !odoSel.dataset.agendaBound) {
        odoSel.dataset.agendaBound = '1';
        odoSel.addEventListener('change', function () { onOdontologoChangeAgenda(); });
    }
    const fechaSel = document.getElementById('fechaCita');
    if (fechaSel && !fechaSel.dataset.agendaBound) {
        fechaSel.dataset.agendaBound = '1';
        fechaSel.addEventListener('change', function () { actualizarHorasDisponibles(); });
        // El input es readonly: el clic abre el calendario con los días que labora el odontólogo
        fechaSel.addEventListener('click', function () {
            if (CalendarioCita.abierto) cerrarCalendarioCita();
            else calCitaAbrir();
        });
    }
    if (!document.body.dataset.calCitaBound) {
        document.body.dataset.calCitaBound = '1';
        // Clic fuera del calendario lo cierra (sin interferir con el modal)
        document.addEventListener('click', function (e) {
            if (!CalendarioCita.abierto) return;
            const wrap = document.getElementById('fechaCitaWrap');
            if (wrap && !wrap.contains(e.target)) cerrarCalendarioCita();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && CalendarioCita.abierto) cerrarCalendarioCita();
        });
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
}

/**
 * Abre el modal para crear una nueva cita
 */
async function openNewAppointmentModal(editData = null) {
    const modal = document.getElementById('newAppointmentModal');
    const form = document.getElementById('newAppointmentForm');

    if (modal && form) {
        // Limpiar formulario
        form.reset();
        const cedulaInputReset = document.getElementById('cedulaPaciente');
        if (cedulaInputReset) cedulaInputReset.value = '';
        mostrarPacientePreview(null);

        // Configurar modo (crear o editar)
        const isEditMode = editData !== null;
        AppointmentsModule.editMode = isEditMode;
        AppointmentsModule.editingAppointmentId = isEditMode ? editData.id : null;

        console.log('Modo edición:', isEditMode, 'Datos:', editData);

        // Cambiar título del modal
        const modalTitle = modal.querySelector('h3');
        if (modalTitle) {
            modalTitle.textContent = isEditMode ? 'Editar Cita' : 'Nueva Cita';
        }

        // Cambiar texto del botón
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = isEditMode ? 'Actualizar Cita' : 'Agendar Cita';
        }

        // Establecer fecha mínima (hoy para nuevas citas, sin restricción para editar)
        const fechaInput = document.getElementById('fechaCita');
        if (!isEditMode) {
            const today = new Date().toISOString().split('T')[0];
            fechaInput.min = today;
        } else {
            fechaInput.removeAttribute('min');
        }

        try {
            // Cargar selects primero (siempre necesario).
            // En creación se precarga la cédula vacía; el paciente se trae por cédula.
            await Promise.all([
                loadPacientesSelect(),
                loadTiposCitaSelect()
            ]);
            // Precargar caché de odontólogos para el filtrado por especialidad
            await loadOdontologosSelect(null, null, true);

            // Si es modo edición, llenar formulario con datos de la cita
            if (isEditMode && editData) {
                console.log('Llenando formulario con datos de edición:', editData);

                // Verificar que los elementos del formulario existen
                const pacienteSelect = document.getElementById('pacienteId');
                const odontologoSelect = document.getElementById('odontologoId');
                const tipoCitaSelect = document.getElementById('tipoCitaId');
                const fechaInput = document.getElementById('fechaCita');
                const horaInput = document.getElementById('horaCita');
                const observacionesInput = document.getElementById('observaciones');

                if (!pacienteSelect || !odontologoSelect || !tipoCitaSelect || !fechaInput || !horaInput) {
                    throw new Error('No se encontraron todos los elementos del formulario');
                }

                // Llenar campos - manejar diferentes estructuras de datos
                try {
                    console.log('Estructura completa de editData:', JSON.stringify(editData, null, 2));

                    // Paciente (también se refleja en el campo de cédula)
                    const pacienteId = editData.paciente?.id || editData.pacienteId;
                    const pacienteDoc = editData.paciente?.documento || editData.documento || '';
                    const cedulaInputEdit = document.getElementById('cedulaPaciente');
                    if (pacienteId) {
                        // Asegurar que el paciente esté en el select (por si se cargó por cédula antes)
                        await ensurePacienteOption(pacienteId, editData.paciente);
                        pacienteSelect.value = pacienteId;
                        console.log('Paciente ID asignado:', pacienteId);
                    } else {
                        console.warn('No se encontró ID del paciente en los datos');
                    }
                    if (cedulaInputEdit) {
                        cedulaInputEdit.value = pacienteDoc || '';
                    }
                    mostrarPacientePreview(editData.paciente);

                    // Tipo de cita (especialidad): primero se fija y luego se filtran odontólogos
                    const tipoCitaId = editData.tipoCita?.id || editData.tipoCitaId;
                    if (tipoCitaId) {
                        tipoCitaSelect.value = tipoCitaId;
                        console.log('Tipo de cita ID asignado:', tipoCitaId);
                    } else {
                        console.warn('No se encontró ID del tipo de cita en los datos');
                    }

                    // Odontólogo: filtrar por la especialidad elegida y luego fijar el valor
                    const odontologoId = editData.odontologo?.id || editData.odontologoId;
                    const tipoNombre = tipoCitaSelect.selectedOptions?.[0]?.textContent || '';
                    await filtrarOdontologosPorEspecialidad(tipoNombre, true);
                    if (odontologoId) {
                        if (!Array.from(odontologoSelect.options).some(o => String(o.value) === String(odontologoId))) {
                            await ensureOdontologoOption(odontologoId, editData.odontologo);
                        }
                        odontologoSelect.value = odontologoId;
                        console.log('Odontólogo ID asignado:', odontologoId);
                    } else {
                        console.warn('No se encontró ID del odontólogo en los datos');
                    }

                    // Fecha y hora
                    const fecha = editData.fecha || editData.fechaCita;
                    const horaOriginal = editData.hora || editData.horaCita;

                    console.log('Fecha original:', fecha);
                    console.log('Hora original:', horaOriginal);

                    if (fecha) {
                        fechaInput.value = fecha;
                        console.log('Fecha asignada al input:', fecha);
                    }

                    if (horaOriginal) {
                        // Usar la función helper para formatear la hora
                        const horaFormateada = formatTimeForSelect(horaOriginal);
                        console.log('Hora formateada:', horaFormateada);

                        horaInput.value = horaFormateada;

                        // Verificar si la hora existe en el select después de un breve delay
                        setTimeout(() => {
                            const horaOption = Array.from(horaInput.options).find(option => option.value === horaFormateada);
                            if (!horaOption && horaFormateada) {
                                console.warn(`La hora ${horaFormateada} no está disponible en las opciones del select`);
                                // Agregar la hora como nueva opción
                                const newOption = document.createElement('option');
                                newOption.value = horaFormateada;
                                newOption.textContent = horaFormateada;
                                horaInput.appendChild(newOption);
                                horaInput.value = horaFormateada;
                                console.log('Nueva opción de hora agregada:', horaFormateada);
                            }
                            console.log('Valor final del select de hora:', horaInput.value);
                        }, 100);
                    }

                    // Observaciones
                    if (observacionesInput) {
                        observacionesInput.value = editData.observaciones || '';
                    }
                    const motivoInput = document.getElementById('motivoConsulta');
                    if (motivoInput) {
                        motivoInput.value = editData.observaciones || '';
                    }

                    // Estado
                    const estadoSelect = document.getElementById('estado');
                    if (estadoSelect && editData.estado) {
                        estadoSelect.value = editData.estado;
                        console.log('Estado asignado:', editData.estado);
                    }

                    console.log('Formulario llenado exitosamente');

                } catch (fillError) {
                    console.error('Error al llenar campos del formulario:', fillError);
                    throw new Error('Error al llenar los datos en el formulario');
                }
            }

        } catch (error) {
            console.error('Error al cargar datos para el modal:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `No se pudieron cargar los datos para ${isEditMode ? 'editar' : 'crear'} la cita. ${error.message}`,
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        // Mostrar modal
        modal.classList.remove('hidden');

        // Mini-calendario: estado inicial según el odontólogo y la fecha del formulario
        CalendarioCita.editingId = isEditMode ? AppointmentsModule.editingAppointmentId : null;
        CalendarioCita.odoId = String(document.getElementById('odontologoId')?.value || '');
        CalendarioCita.cache = {};
        cerrarCalendarioCita();
        actualizarHintDias();

        // Sincronizar horas con la agenda real (evita elegir un turno cerrado/ocupado)
        setupEventListeners();
        try {
            if (isEditMode && editData && editData.fecha) {
                await actualizarHorasDisponibles(false);
                // Conservar la hora actual de la cita en edición aunque ya no esté libre
                const horaInputEdit = document.getElementById('horaCita');
                const horaActual = formatTimeForSelect(editData.hora || editData.horaCita);
                if (horaInputEdit && horaActual
                    && !Array.from(horaInputEdit.options).some(o => o.value === horaActual)) {
                    const opt = document.createElement('option');
                    opt.value = horaActual;
                    opt.textContent = formatearHora12(horaActual) + ' (actual)';
                    horaInputEdit.appendChild(opt);
                    horaInputEdit.value = horaActual;
                }
            } else {
                await actualizarHorasDisponibles();
            }
        } catch (e) { /* la agenda se valida de nuevo al guardar */ }

        // Focus en la cédula (nuevo flujo: primero se digita la cédula)
        setTimeout(() => {
            const cedulaInput = document.getElementById('cedulaPaciente');
            if (cedulaInput) cedulaInput.focus();
            else {
                const firstSelect = form.querySelector('select');
                if (firstSelect) firstSelect.focus();
            }
        }, 100);

        // Animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } else {
        console.error('No se encontraron los elementos del modal o formulario');
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir el formulario de citas.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Cierra el modal de nueva cita
 */
function closeNewAppointmentModal() {
    const modal = document.getElementById('newAppointmentModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    // Resetear modo de edición
    AppointmentsModule.editMode = false;
    AppointmentsModule.editingAppointmentId = null;
    cerrarCalendarioCita();
}

/**
 * Maneja el envío del formulario de nueva cita
 */
async function handleNewAppointmentSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const appointmentData = Object.fromEntries(formData);

    // Validar datos
    const validation = validateAppointmentData(appointmentData);
    if (!validation.isValid) {
        showValidationError(validation.errors);
        return;
    }

    console.log('Datos del formulario validados:', appointmentData);

    try {
        // Determinar si es creación o edición
        const isEdit = AppointmentsModule.editMode;

        // Preparar datos para la API (el backend espera objetos, no IDs)
        // enviarRecordatorio: checkbox del formulario (el correo solo llega al paciente).
        var enviarRecordatorioEl = document.getElementById('enviarRecordatorio');
        const citaData = {
            paciente: { id: parseInt(appointmentData.pacienteId) },
            odontologo: { id: parseInt(appointmentData.odontologoId) },
            tipoCita: { id: parseInt(appointmentData.tipoCitaId) },
            fecha: appointmentData.fechaCita,
            hora: appointmentData.horaCita,
            observaciones: appointmentData.motivoConsulta || appointmentData.observaciones || '',
            estado: appointmentData.estado || 'PENDIENTE',
            enviarRecordatorio: enviarRecordatorioEl ? enviarRecordatorioEl.checked : true
        };

        // En modo edición, agregar el ID de la cita
        if (isEdit && AppointmentsModule.editingAppointmentId) {
            citaData.id = AppointmentsModule.editingAppointmentId;
        }

        console.log('Datos preparados para enviar:', citaData);
        const actionText = isEdit ? 'Actualizando' : 'Programando';
        const successText = isEdit ? 'actualizada' : 'programada';

        console.log('Modo edición:', isEdit, 'ID cita:', AppointmentsModule.editingAppointmentId);

        // Validación contra la agenda real antes de enviar (evita el 409/500)
        // En edición se permite conservar la hora actual aunque ya no figure libre.
        try {
            const dia = await CitasAPI.getAgendaDia(citaData.odontologo.id, citaData.fecha);
            const horaSel = String(citaData.hora || '').slice(0, 5);
            const slot = (dia.turnos || []).find(t => String(t.hora).slice(0, 5) === horaSel);
            const esHoraActualEdicion = isEdit && (function () {
                const cur = (AppointmentsModule.cachedCitas || []).find(c => String(c.id) === String(AppointmentsModule.editingAppointmentId));
                return cur && String(cur.fecha).slice(0, 10) === String(citaData.fecha).slice(0, 10)
                    && String(cur.hora).slice(0, 5) === horaSel
                    && String((cur.odontologo && cur.odontologo.id) || '') === String(citaData.odontologo.id);
            })();
            if (!slot || (slot.estado !== 'LIBRE' && !esHoraActualEdicion)) {
                const libres = (dia.turnos || []).filter(t => t.estado === 'LIBRE').map(t => String(t.hora).slice(0, 5));
                await Swal.fire({
                    icon: 'warning',
                    title: 'Turno no disponible en la agenda',
                    html: `<div class="text-left"><p class="text-gray-600 mb-2">${slot ? `La hora ${horaSel} está <strong>${slot.estado}</strong> para ese odontólogo.` : `La hora ${horaSel} está fuera del horario del odontólogo ese día.`}</p>`
                        + (libres.length ? `<p class="text-gray-600">Turnos libres el ${citaData.fecha}: <strong>${libres.join(', ')}</strong></p>` : `<p class="text-gray-600">No hay turnos libres ese día. Elija otra fecha u odontólogo, o pida una apertura extra en Agenda Médica.</p>`)
                        + `</div>`,
                    confirmButtonText: 'Elegir otro turno',
                    confirmButtonColor: '#f59e0b'
                });
                await actualizarHorasDisponibles();
                return;
            }
        } catch (preErr) {
            // Si la pre-validación misma falla por red, se deja que el backend decida
            console.warn('Pre-validación de agenda omitida:', preErr && preErr.message);
            if (preErr && /Turno no disponible|no labora|fuera del horario|ocupado|bloqueado|Sin turnos/i.test(preErr.message || '')) return;
        }

        // Mostrar loading
        Swal.fire({
            title: `${actionText} cita...`,
            html: `Por favor espere mientras procesamos la información de la cita médica`,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        let result;
        if (isEdit) {
            // Verificar que tenemos el ID para actualizar
            if (!AppointmentsModule.editingAppointmentId) {
                throw new Error('No se encontró el ID de la cita para actualizar');
            }
            // Aviso: cambiar fecha/hora/odontólogo reprograma la cita (pasa a REPROGRAMADA)
            const curEdit = (AppointmentsModule.cachedCitas || []).find(c => String(c.id) === String(AppointmentsModule.editingAppointmentId));
            const turnoCambiado = curEdit && (
                String(curEdit.fecha).slice(0, 10) !== String(citaData.fecha).slice(0, 10) ||
                String(curEdit.hora).slice(0, 5) !== String(citaData.hora).slice(0, 5) ||
                String((curEdit.odontologo && curEdit.odontologo.id) || '') !== String(citaData.odontologo.id)
            );
            if (turnoCambiado) {
                const conf = await Swal.fire({
                    icon: 'info',
                    title: 'La cita quedará reprogramada',
                    html: '<p class="text-gray-600">Cambió la <strong>fecha, hora u odontólogo</strong>: al guardar, el estado pasará a <strong>REPROGRAMADA</strong>.</p>',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, reprogramar',
                    cancelButtonText: 'Revisar',
                    confirmButtonColor: '#7c3aed',
                    cancelButtonColor: '#6b7280'
                });
                if (!conf.isConfirmed) {
                    Swal.close();
                    return;
                }
            }
            // Actualizar cita existente
            result = await CitasAPI.updateCita(AppointmentsModule.editingAppointmentId, citaData);
            if (result && String(result.estado || '').toUpperCase() === 'REPROGRAMADA') {
                await Swal.fire({
                    icon: 'info',
                    title: 'Cita reprogramada',
                    html: `<p class="text-gray-600">Nueva fecha: <strong>${formatDate(result.fecha)} a las ${result.hora}</strong>. Estado: <strong>REPROGRAMADA</strong>.</p>`,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#7c3aed'
                });
            }
        } else {
            // Crear nueva cita
            result = await CitasAPI.createCita(citaData);
        }

        // Cerrar modal
        closeNewAppointmentModal();

        // Resetear modo de edición
        AppointmentsModule.editMode = false;
        AppointmentsModule.editingAppointmentId = null;

        // Mostrar éxito con opción de imprimir el comprobante (punto 3)
        AppointmentsModule.currentAppointment = result;
        var swalResult = await Swal.fire({
            icon: 'success',
            title: `¡Cita ${successText} exitosamente!`,
            html: `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-calendar-check text-4xl text-emerald-500 mb-2"></i>
                    </div>
                    <p class="text-gray-600">La cita para <strong>${result.paciente.nombres} ${result.paciente.apellidos}</strong> ha sido ${successText}.</p>
                    <div class="mt-4 p-3 bg-emerald-50 rounded-lg">
                        <p class="text-sm text-emerald-700">
                            <i class="fas fa-calendar mr-1"></i>
                            ${formatDate(result.fecha)} a las ${result.hora}
                        </p>
                        <p class="text-sm text-emerald-700">
                            <i class="fas fa-user-md mr-1"></i>
                            Dr. ${result.odontologo.nombre} ${result.odontologo.apellido}
                        </p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-print mr-2"></i>Imprimir comprobante',
            cancelButtonText: 'Entendido',
            confirmButtonColor: '#059669',
            cancelButtonColor: '#6b7280'
        });
        if (swalResult.isConfirmed) {
            printAppointment();
        }

        // Recargar lista
        await loadAppointments();

    } catch (error) {
        console.error('Error al procesar cita:', error);

        // Log más detallado para debugging
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            response: error.response,
            stack: error.stack
        });

        const actionText = AppointmentsModule.editMode ? 'actualizar' : 'programar';

        // Mostrar error más específico si está disponible
        let errorMessage = `No se pudo ${actionText} la cita médica. Por favor intente nuevamente.`;

        if (error.message) {
            errorMessage += `\n\nDetalle: ${error.message}`;
        }

        Swal.fire({
            icon: 'error',
            title: `Error al ${actionText} cita`,
            text: errorMessage,
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Valida los datos de la cita médica
 */
function validateAppointmentData(data) {
    const errors = [];

    // Validaciones requeridas (todos los campos del formulario son obligatorios)
    if (!data.pacienteId) errors.push('Debe seleccionar un paciente');
    if (!data.tipoCitaId) errors.push('Debe seleccionar el tipo de cita');
    if (!data.fechaCita) errors.push('Debe seleccionar una fecha');
    if (!data.horaCita) errors.push('Debe seleccionar una hora');
    if (!data.duracion) errors.push('Debe seleccionar la duración');
    if (!data.odontologoId) errors.push('Debe asignar un odontólogo');
    if (!data.consultorio) errors.push('Debe seleccionar el consultorio');
    if (!data.motivoConsulta?.trim()) errors.push('El motivo de la consulta es requerido');
    if (!data.estado) errors.push('Debe seleccionar el estado inicial');
    if (!data.prioridad) errors.push('Debe seleccionar la prioridad');

    // Validación de fecha
    if (data.fechaCita) {
        // Crear fecha sin problemas de zona horaria
        const [year, month, day] = data.fechaCita.split('-');
        const selectedDate = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
        const today = new Date();

        // Normalizar fechas para comparar solo días (sin horas)
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (selectedDateOnly < todayOnly) {
            errors.push('No se pueden programar citas en fechas pasadas');
        }

        // Validar que no sea domingo
        if (selectedDate.getDay() === 0) {
            errors.push('La clínica no atiende los domingos');
        }
    }

    // Validación de hora
    if (data.horaCita) {
        const hour = parseInt(data.horaCita.split(':')[0]);
        if (hour < 8 || hour >= 18) {
            errors.push('Las citas solo se pueden programar entre 8:00 AM y 6:00 PM');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Muestra errores de validación
 */
function showValidationError(errors) {
    const errorList = errors.map(error => `<li class="text-left">${error}</li>`).join('');

    Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        html: `
            <div class="text-left">
                <p class="text-gray-600 mb-3">Por favor corrija los siguientes errores:</p>
                <ul class="text-red-600 list-disc ml-4">
                    ${errorList}
                </ul>
            </div>
        `,
        confirmButtonText: 'Corregir',
        confirmButtonColor: '#f59e0b'
    });
}

/**
 * Ver detalles de una cita
 */
async function viewAppointment(appointmentId) {
    // Apertura instantánea desde caché (sin loader visible)
    const cached = (AppointmentsModule.cachedCitas || []).find(c => String(c.id) === String(appointmentId));
    if (cached) {
        showAppointmentDetailsModal(cached);
        return;
    }

    try {
        // Respaldo: traer de la API con indicador (solo si no está en caché)
        Swal.fire({
            title: 'Cargando detalles de la cita...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Obtener datos reales de la API
        const appointment = await CitasAPI.getCitaById(appointmentId);

        // Cerrar loading
        Swal.close();

        // Mostrar modal de detalles
        showAppointmentDetailsModal(appointment);

    } catch (error) {
        console.error('Error al cargar cita:', error);
        Swal.close();

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información de la cita.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Muestra el modal con los detalles de la cita
 */
function showAppointmentDetailsModal(appointment) {
    // Llenar datos en el modal
    document.getElementById('viewAppointmentTitle').textContent = `Cita - ${formatDate(appointment.fecha)} ${appointment.hora}`;
    document.getElementById('viewAppointmentPatient').textContent = `${appointment.paciente.nombres} ${appointment.paciente.apellidos}`;
    document.getElementById('viewAppointmentType').textContent = appointment.tipoCita.nombre;
    document.getElementById('viewAppointmentDateTime').textContent = `${formatDate(appointment.fecha)} a las ${appointment.hora}`;

    // Llenar detalles
    document.getElementById('viewPatientDocument').textContent = appointment.paciente.documento || 'No especificado';
    document.getElementById('viewPatientPhone').textContent = appointment.paciente.telefono || 'No especificado';
    document.getElementById('viewAppointmentDuration').textContent = `${appointment.tipoCita.duracion || 30} minutos`;
    document.getElementById('viewAppointmentOffice').textContent = appointment.consultorio || 'Por asignar';
    document.getElementById('viewAppointmentDoctor').textContent = `Dr. ${appointment.odontologo.nombre} ${appointment.odontologo.apellido}`;
    document.getElementById('viewDoctorSpecialty').textContent = appointment.odontologo.especialidad || 'Odontología General';
    document.getElementById('viewAppointmentReason').textContent = appointment.observaciones || 'No especificado';

    // Estado
    const statusElement = document.getElementById('viewAppointmentStatus');
    statusElement.textContent = getStatusText(appointment.estado);
    statusElement.className = `px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.estado)}`;

    // Actualizar avatar
    const avatar = document.getElementById('viewAppointmentAvatar');
    avatar.innerHTML = getPatientProfileImage(appointment.paciente.genero);

    // Guardar referencia de la cita actual
    AppointmentsModule.currentAppointment = appointment;

    // Botón de confirmación: bloqueado por defecto, solo se habilita el mismo día antes de la hora
    const btnConfirmar = document.getElementById('btnConfirmarDetalle');
    const hintConfirmar = document.getElementById('confirmarDetalleHint');
    if (btnConfirmar) {
        const habilitado = puedeConfirmarCita(appointment);
        btnConfirmar.disabled = !habilitado;
        btnConfirmar.classList.toggle('opacity-50', !habilitado);
        btnConfirmar.classList.toggle('cursor-not-allowed', !habilitado);
        btnConfirmar.title = habilitado
            ? 'Confirmar la cita (solo hoy, antes de su hora)'
            : 'La confirmación se habilita el mismo día de la cita, antes de su hora';
        if (hintConfirmar) {
            hintConfirmar.textContent = habilitado
                ? 'Puede confirmar ahora: la cita es hoy y aún no llega su hora.'
                : 'La confirmación se habilita el mismo día de la cita, antes de su hora.';
        }
    }

    // Botón de recordatorio por correo: independiente, solo se habilita un día antes
    const btnRecordatorio = document.getElementById('btnRecordatorioDetalle');
    const hintRecordatorio = document.getElementById('recordatorioDetalleHint');
    if (btnRecordatorio) {
        const habilitado = puedeEnviarRecordatorio(appointment);
        const yaEnviado = appointment && appointment.recordatorioEnviado === true;
        btnRecordatorio.disabled = !habilitado;
        btnRecordatorio.classList.toggle('opacity-50', !habilitado);
        btnRecordatorio.classList.toggle('cursor-not-allowed', !habilitado);
        btnRecordatorio.title = habilitado
            ? (yaEnviado ? 'Reenviar el recordatorio por correo' : 'Enviar el recordatorio por correo')
            : 'El recordatorio se habilita únicamente un día antes de la cita';
        btnRecordatorio.innerHTML = yaEnviado
            ? '<i class="fas fa-bell mr-2"></i>\n              Reenviar recordatorio'
            : '<i class="fas fa-bell mr-2"></i>\n              Enviar recordatorio';
        if (hintRecordatorio) {
            hintRecordatorio.textContent = habilitado
                ? (yaEnviado
                    ? 'El recordatorio ya fue enviado; puede reenviarlo mientras sea un día antes.'
                    : 'Puede enviar ahora el recordatorio por correo al paciente.')
                : 'El recordatorio por correo se habilita únicamente un día antes de la cita.';
        }
    }

    // Botón Finalizar: lo realiza el odontólogo asignado (CONFIRMADA + fecha/hora pasada)
    const btnFinalizar = document.getElementById('btnFinalizarDetalle');
    const hintFinalizar = document.getElementById('finalizarDetalleHint');
    if (btnFinalizar) {
        const habilitado = puedeFinalizarCita(appointment);
        btnFinalizar.disabled = !habilitado;
        btnFinalizar.classList.toggle('opacity-50', !habilitado);
        btnFinalizar.classList.toggle('cursor-not-allowed', !habilitado);
        btnFinalizar.title = habilitado
            ? 'Finalizar la cita (odontólogo asignado, tras la atención)'
            : 'Solo el odontólogo asignado finaliza una cita confirmada pasada su fecha/hora';
        if (hintFinalizar) {
            hintFinalizar.textContent = habilitado
                ? 'Puede finalizar ahora: cita confirmada y horario ya cumplido.'
                : 'La finalización la realiza el odontólogo tras la atención.';
        }
    }

    // Aviso de inasistencia automática: NO_ASISTIDA la marca el sistema
    // 1 minuto después de la fecha/hora, sin acción manual e inmutable.
    const hintNoAsistida = document.getElementById('noAsistidaDetalleHint');
    if (hintNoAsistida) {
        const esNoAsistida = String(appointment.estado || '').toUpperCase() === 'NO_ASISTIDA';
        hintNoAsistida.textContent = esNoAsistida
            ? 'Estado terminal e inmutable: marcada automáticamente por el sistema al vencer su horario sin asistencia.'
            : 'Si la cita pasa su fecha y horario sin asistencia, el sistema la marcará NO_ASISTIDA automáticamente.';
    }

    // Mostrar modal
    const modal = document.getElementById('viewAppointmentModal');
    modal.classList.remove('hidden');

    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Cierra el modal de detalles de la cita
 */
function closeViewAppointmentModal() {
    const modal = document.getElementById('viewAppointmentModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    AppointmentsModule.currentAppointment = null;
}

/**
 * Editar cita
 */
async function editAppointment(appointmentId) {
    // Apertura instantánea desde caché (sin loader visible)
    const cached = (AppointmentsModule.cachedCitas || []).find(c => String(c.id) === String(appointmentId));
    if (cached) {
        if (esNoAsistida(cached)) {
            Swal.fire({ icon: 'info', title: 'Cita no asistida', text: 'Estado terminal e inmutable: fue marcada automáticamente por el sistema y no admite modificaciones.', confirmButtonColor: '#4b5563' });
            return;
        }
        await openNewAppointmentModal(cached);
        return;
    }

    try {
        // Respaldo: traer de la API con indicador (solo si no está en caché)
        Swal.fire({
            title: 'Cargando datos de la cita...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Obtener datos de la cita
        const appointment = await CitasAPI.getCitaById(appointmentId);

        // Verificar que los datos se cargaron correctamente
        console.log('Datos de la cita obtenidos:', appointment);

        if (!appointment) {
            throw new Error('No se pudieron obtener los datos de la cita');
        }

        // Verificar que los datos tengan la estructura esperada
        if (!appointment.id) {
            console.error('Los datos de la cita no tienen ID:', appointment);
            throw new Error('Datos de cita inválidos');
        }

        // Cerrar loading
        Swal.close();

        if (esNoAsistida(appointment)) {
            Swal.fire({ icon: 'info', title: 'Cita no asistida', text: 'Estado terminal e inmutable: fue marcada automáticamente por el sistema y no admite modificaciones.', confirmButtonColor: '#4b5563' });
            return;
        }

        // Abrir modal de nueva cita en modo edición
        await openNewAppointmentModal(appointment);

    } catch (error) {
        console.error('Error al cargar cita para edición:', error);
        Swal.close();

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los datos para editar la cita. Verifica la conexión y que la cita exista.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Confirmar cita: botón bloqueado por defecto, solo se habilita el mismo día
 * antes de la hora de la cita. No envía correos (el recordatorio es aparte).
 */
async function confirmAppointment(appointmentId) {
    // Obtener datos reales de la cita desde la API
    const appointment = await getAppointmentData(appointmentId);

    if (!appointment) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener la información de la cita para confirmar.',
            confirmButtonColor: '#dc2626'
        });
        return;
    }

    const info = normalizeAppointmentForDialogs(appointment);

    // Regla de negocio: solo el mismo día, antes de la hora de la cita
    if (!puedeConfirmarCita(appointment)) {
        Swal.fire({
            icon: 'info',
            title: 'Confirmación no disponible',
            html: `
                <div class="text-center">
                    <p class="text-gray-600">La cita de <strong>${info.pacienteNombre}</strong> solo puede confirmarse <strong>el mismo día, antes de su hora</strong>.</p>
                    <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-calendar-day mr-1"></i>
                            Fecha de la cita: ${formatDate(info.fechaCita)} a las ${info.horaCita} — el botón se habilitará ese día.
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    const result = await Swal.fire({
        icon: 'question',
        title: '¿Confirmar cita médica?',
        html: `
            <div class="text-center">
                <div class="mb-4">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-check-circle text-green-600 text-xl"></i>
                    </div>
                    <p class="text-gray-700 mb-2">Paciente: <strong>${info.pacienteNombre}</strong></p>
                    <p class="text-sm text-gray-500">${formatDate(info.fechaCita)} a las ${info.horaCita}</p>
                </div>
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p class="text-green-800 text-sm">
                        <i class="fas fa-info-circle mr-2"></i>
                        Al confirmar la cita, se enviará una notificación al paciente y se actualizará el estado en el sistema.
                    </p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
        try {
            // Mostrar progreso
            Swal.fire({
                title: 'Confirmando cita...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Confirmación de la cita (POST /api/citas/{id}/confirmar). No envía correos.
            await CitasAPI.confirmarCita(appointmentId);

            // Confirmar éxito
            await Swal.fire({
                icon: 'success',
                title: 'Cita confirmada',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">La cita de <strong>${info.pacienteNombre}</strong> ha sido confirmada exitosamente.</p>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#10b981'
            });

            // Recargar lista
            await loadAppointments();
            updateTodayTimeline();

        } catch (error) {
            console.error('Error al confirmar cita:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al confirmar',
                text: (error && error.message) ? String(error.message).slice(0, 400) : 'No se pudo confirmar la cita.',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/** Confirmar desde el modal de detalle (usa la cita actual). */
async function confirmAppointmentFromModal() {
    const cita = AppointmentsModule.currentAppointment;
    if (!cita || !cita.id) {
        Swal.fire({ icon: 'warning', title: 'Sin cita seleccionada', confirmButtonColor: '#f59e0b' });
        return;
    }
    await confirmAppointment(cita.id);
    // Refrescar el detalle si sigue abierto
    try {
        const actualizada = await CitasAPI.getCitaById(cita.id);
        showAppointmentDetailsModal(actualizada);
    } catch (e) { /* el listado ya se recargó */ }
}

/**
 * Finalizar cita: la realiza el odontólogo asignado después de la atención.
 * Solo CONFIRMADA con fecha/hora ya pasada.
 */
async function finalizeAppointment(appointmentId) {
    const appointment = await getAppointmentData(appointmentId);
    if (!appointment) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener la información de la cita.', confirmButtonColor: '#dc2626' });
        return;
    }
    if (!puedeFinalizarCita(appointment)) {
        Swal.fire({
            icon: 'info',
            title: 'Finalización no disponible',
            html: '<p class="text-gray-600">Solo el <strong>odontólogo asignado</strong> puede finalizar una cita <strong>confirmada</strong> una vez pasada su fecha y horario.</p>',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }
    const info = normalizeAppointmentForDialogs(appointment);
    const result = await Swal.fire({
        icon: 'question',
        title: '¿Finalizar cita?',
        html: `
            <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-flag-checkered text-blue-600 text-xl"></i>
                </div>
                <p class="text-gray-700 mb-2">Paciente: <strong>${info.pacienteNombre}</strong></p>
                <p class="text-sm text-gray-500">${formatDate(info.fechaCita)} a las ${info.horaCita}</p>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                    <p class="text-blue-800 text-sm"><i class="fas fa-user-md mr-2"></i>La finalización la registra el odontólogo <strong>${info.odontologoNombre || 'asignado'}</strong> tras la atención. El estado pasará a <strong>FINALIZADA</strong>.</p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280'
    });
    if (!result.isConfirmed) return;
    try {
        Swal.fire({ title: 'Finalizando cita...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const odontologoId = appointment.odontologo && appointment.odontologo.id ? appointment.odontologo.id : null;
        await CitasAPI.finalizarCita(appointmentId, odontologoId);
        await Swal.fire({ icon: 'success', title: 'Cita finalizada', text: `La cita de ${info.pacienteNombre} fue finalizada por el odontólogo.`, confirmButtonColor: '#2563eb' });
        await loadAppointments();
        updateTodayTimeline();
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error al finalizar', text: (error && error.message) || 'No se pudo finalizar la cita.', confirmButtonColor: '#dc2626' });
    }
}

/** Finalizar desde el modal de detalle (usa la cita actual). */
async function finalizeAppointmentFromModal() {
    const cita = AppointmentsModule.currentAppointment;
    if (!cita || !cita.id) {
        Swal.fire({ icon: 'warning', title: 'Sin cita seleccionada', confirmButtonColor: '#f59e0b' });
        return;
    }
    await finalizeAppointment(cita.id);
    try {
        const actualizada = await CitasAPI.getCitaById(cita.id);
        showAppointmentDetailsModal(actualizada);
    } catch (e) { /* el listado ya se recargó */ }
}

// NOTA: NO_ASISTIDA es automática (el sistema la marca 1 minuto después de la
// fecha/hora sin asistencia) e inmutable. Sin diálogo ni botón manual.

/**
 * Recordatorio de cita por correo: botón bloqueado por defecto, solo se
 * habilita un día antes de la cita. No cambia el estado (independiente
 * de la confirmación, que es el mismo día antes de la hora).
 */
async function sendReminderAppointment(appointmentId) {
    const appointment = await getAppointmentData(appointmentId);

    if (!appointment) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener la información de la cita para enviar el recordatorio.',
            confirmButtonColor: '#dc2626'
        });
        return;
    }

    const info = normalizeAppointmentForDialogs(appointment);

    // Regla de negocio: solo un día antes (la fecha de la cita debe ser mañana)
    if (!puedeEnviarRecordatorio(appointment)) {
        Swal.fire({
            icon: 'info',
            title: 'Recordatorio no disponible',
            html: `
                <div class="text-center">
                    <p class="text-gray-600">El recordatorio de la cita de <strong>${info.pacienteNombre}</strong> solo puede enviarse <strong>un día antes</strong>.</p>
                    <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-bell mr-1"></i>
                            Fecha de la cita: ${formatDate(info.fechaCita)} — el botón se habilitará el día anterior.
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    const yaEnviado = appointment.recordatorioEnviado === true;
    const result = await Swal.fire({
        icon: 'question',
        title: yaEnviado ? '¿Reenviar recordatorio?' : '¿Enviar recordatorio por correo?',
        html: `
            <div class="text-center">
                <div class="mb-4">
                    <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-bell text-amber-600 text-xl"></i>
                    </div>
                    <p class="text-gray-700 mb-2">Paciente: <strong>${info.pacienteNombre}</strong></p>
                    <p class="text-sm text-gray-500">${formatDate(info.fechaCita)} a las ${info.horaCita}</p>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p class="text-amber-800 text-sm">
                        <i class="fas fa-info-circle mr-2"></i>
                        Se enviará el recordatorio por correo al paciente. El estado de la cita no cambiará.
                    </p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: yaEnviado ? 'Sí, reenviar' : 'Sí, enviar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({
                title: 'Enviando recordatorio...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Recordatorio por correo (POST /api/citas/{id}/recordatorio). No cambia el estado.
            await CitasAPI.enviarRecordatorio(appointmentId);

            await Swal.fire({
                icon: 'success',
                title: 'Recordatorio enviado',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">Se envió el recordatorio por correo para la cita de <strong>${info.pacienteNombre}</strong>.</p>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#f59e0b'
            });

            await loadAppointments();
            updateTodayTimeline();

        } catch (error) {
            console.error('Error al enviar recordatorio:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al enviar el recordatorio',
                text: (error && error.message) ? String(error.message).slice(0, 400) : 'No se pudo enviar el recordatorio.',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/** Enviar recordatorio desde el modal de detalle (usa la cita actual). */
async function sendReminderFromModal() {
    const cita = AppointmentsModule.currentAppointment;
    if (!cita || !cita.id) {
        Swal.fire({ icon: 'warning', title: 'Sin cita seleccionada', confirmButtonColor: '#f59e0b' });
        return;
    }
    await sendReminderAppointment(cita.id);
    // Refrescar el detalle si sigue abierto
    try {
        const actualizada = await CitasAPI.getCitaById(cita.id);
        showAppointmentDetailsModal(actualizada);
    } catch (e) { /* el listado ya se recargó */ }
}

/**
 * Cancelar cita
 */
async function cancelAppointment(appointmentId) {
    // Obtener datos reales de la cita
    const appointment = await getAppointmentData(appointmentId);

    if (!appointment) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener la información de la cita para cancelar.',
            confirmButtonColor: '#dc2626'
        });
        return;
    }

    if (esNoAsistida(appointment)) {
        Swal.fire({
            icon: 'info',
            title: 'Cita no asistida',
            text: 'Estado terminal e inmutable: fue marcada automáticamente por el sistema y no admite modificaciones.',
            confirmButtonColor: '#4b5563'
        });
        return;
    }

    const info = normalizeAppointmentForDialogs(appointment);

    const { value: reason } = await Swal.fire({
        icon: 'warning',
        title: '¿Cancelar cita médica?',
        html: `
            <div class="text-center mb-4">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-times-circle text-red-600 text-xl"></i>
                </div>
                <p class="text-gray-700 mb-2">Paciente: <strong>${info.pacienteNombre}</strong></p>
                <p class="text-sm text-gray-500">${formatDate(info.fechaCita)} a las ${info.horaCita}</p>
            </div>
            <div class="text-left">
                <label class="block text-sm font-medium text-gray-700 mb-2">Motivo de cancelación:</label>
                <textarea id="swal-input1" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Indique el motivo de la cancelación..."></textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Cancelar Cita',
        cancelButtonText: 'No cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        preConfirm: () => {
            const reason = document.getElementById('swal-input1').value;
            if (!reason.trim()) {
                Swal.showValidationMessage('Debe indicar el motivo de cancelación');
                return false;
            }
            return reason;
        }
    });

    if (reason) {
        try {
            // Mostrar progreso
            Swal.fire({
                title: 'Cancelando cita...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Llamada real para cancelar (actualizar estado a CANCELADA)
            await CitasAPI.updateCita(appointmentId, { estado: 'CANCELADA', motivoCancelacion: reason });

            // Confirmar cancelación
            await Swal.fire({
                icon: 'success',
                title: 'Cita cancelada',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">La cita de <strong>${info.pacienteNombre}</strong> ha sido cancelada.</p>
                        <div class="mt-4 p-3 bg-red-50 rounded-lg">
                            <p class="text-sm text-red-700">
                                <i class="fas fa-info-circle mr-1"></i>
                                Motivo: ${reason}
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            });

            // Recargar lista
            await loadAppointments();
            updateTodayTimeline();

        } catch (error) {
            console.error('Error al cancelar cita:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al cancelar',
                text: (error && error.message) ? String(error.message).slice(0, 400) : 'No se pudo cancelar la cita.',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/**
 * Abrir vista de calendario
 */
function openCalendarView() {
    Swal.fire({
        icon: 'info',
        title: 'Vista de Calendario',
        html: `
            <div class="text-center">
                <i class="fas fa-calendar-alt text-4xl text-blue-500 mb-3"></i>
                <p class="text-gray-600">La vista de calendario estará disponible próximamente.</p>
                <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-700">
                        <i class="fas fa-info-circle mr-1"></i>
                        Permitirá visualizar todas las citas en formato calendario
                    </p>
                </div>
            </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6'
    });
}

/**
 * Imprimir comprobante de la cita actual (punto 3 del plan de acción).
 * Rellena la sección imprimible #comprobanteCita y abre el diálogo
 * de impresión del navegador (solo el comprobante es visible en papel).
 */
function printAppointment() {
    var cita = AppointmentsModule.currentAppointment;
    if (!cita) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin cita seleccionada',
            text: 'Abra el detalle de una cita para imprimir su comprobante.',
            confirmButtonColor: '#f59e0b'
        });
        return;
    }
    if (!rellenarComprobante(cita)) {
        Swal.fire({
            icon: 'error',
            title: 'No se pudo generar el comprobante',
            confirmButtonColor: '#dc2626'
        });
        return;
    }
    window.print();
}

/**
 * Rellena el comprobante imprimible con los datos de la cita.
 * @returns {boolean} false si falta la sección en el DOM.
 */
function rellenarComprobante(cita) {
    var box = document.getElementById('comprobanteCita');
    if (!box) return false;

    var set = function (id, valor) {
        var el = document.getElementById(id);
        if (el) el.textContent = valor || '—';
    };

    var paciente = ((cita.paciente && cita.paciente.nombres) || '') + ' ' + ((cita.paciente && cita.paciente.apellidos) || '');
    var odontologo = 'Dr. ' + (((cita.odontologo && cita.odontologo.nombre) || '') + ' ' + ((cita.odontologo && cita.odontologo.apellido) || '')).trim();

    set('compFolio', 'Folio CITA-' + (cita.id || '—'));
    set('compFechaEmision', new Date().toLocaleString('es-CO'));
    set('compPaciente', paciente.trim() || '—');
    set('compDocumento', (cita.paciente && cita.paciente.documento) || 'No especificado');
    set('compTelefono', (cita.paciente && cita.paciente.telefono) || 'No especificado');
    set('compFecha', formatDate(cita.fecha));
    set('compHora', cita.hora || '—');
    set('compTipo', (cita.tipoCita && cita.tipoCita.nombre) || 'Consulta General');
    set('compOdontologo', odontologo);
    set('compConsultorio', cita.consultorio || 'Por asignar');
    set('compEstado', getStatusText(cita.estado));
    set('compMotivo', cita.observaciones || 'No especificado');
    return true;
}

/**
 * Imprime una cita recién creada (se usa desde el éxito del formulario).
 */
function printCitaById(citaId) {
    var cached = (AppointmentsModule.cachedCitas || []).find(function (c) {
        return String(c.id) === String(citaId);
    });
    if (cached) {
        AppointmentsModule.currentAppointment = cached;
        printAppointment();
        return;
    }
    CitasAPI.getCitaById(citaId).then(function (cita) {
        AppointmentsModule.currentAppointment = cita;
        printAppointment();
    }).catch(function () {
        Swal.fire({ icon: 'error', title: 'No se pudo cargar la cita para imprimir', confirmButtonColor: '#dc2626' });
    });
}

/**
 * Navegación de fechas
 */
function goToPreviousDay() {
    AppointmentsModule.currentDate.setDate(AppointmentsModule.currentDate.getDate() - 1);
    updateCurrentDate();
    updateTodayTimeline();
}

function goToNextDay() {
    AppointmentsModule.currentDate.setDate(AppointmentsModule.currentDate.getDate() + 1);
    updateCurrentDate();
    updateTodayTimeline();
}

function goToToday() {
    AppointmentsModule.currentDate = new Date();
    updateCurrentDate();
    updateTodayTimeline();
}

/**
 * Actualizar fecha actual mostrada
 */
function updateCurrentDate() {
    const dateElement = document.getElementById('todayDate');
    if (dateElement) {
        dateElement.textContent = formatDateLong(AppointmentsModule.currentDate);
    }
}

/**
 * Actualizar timeline del día
 */
async function updateTodayTimeline() {
    console.log('📅 Actualizando timeline del día:', AppointmentsModule.currentDate);

    const timelineContainer = document.getElementById('todayTimeline');
    if (!timelineContainer) return;

    try {
        // Mostrar loading
        timelineContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
                <p>Cargando citas del día...</p>
            </div>
        `;

        // Obtener todas las citas
        const allCitas = await CitasAPI.getAllCitas();

        // Filtrar citas del día actual
        const today = AppointmentsModule.currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const citasDelDia = allCitas.filter(cita => {
            const citaFecha = new Date(cita.fecha).toISOString().split('T')[0];
            return citaFecha === today;
        });

        // Ordenar por hora
        citasDelDia.sort((a, b) => {
            const horaA = a.hora || '00:00';
            const horaB = b.hora || '00:00';
            return horaA.localeCompare(horaB);
        });

        if (citasDelDia.length === 0) {
            timelineContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-alt text-3xl mb-3"></i>
                    <p>No hay citas programadas para este día</p>
                    <button class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors" onclick="openNewAppointmentModal()">
                        <i class="fas fa-plus mr-2"></i>
                        Programar Nueva Cita
                    </button>
                </div>
            `;
            return;
        }

        // Generar HTML para las citas
        const citasHTML = citasDelDia.map(cita => {
            const statusColor = getStatusColor(cita.estado);
            const statusText = getStatusText(cita.estado);
            const hora = formatTime(cita.hora);
            const tipoCitaIcon = getTipoCitaIcon(cita.tipoCita?.nombre || '');

            return `
                <div class="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div class="flex-shrink-0 text-center mr-4">
                        <div class="text-sm font-semibold text-gray-700">${hora.time}</div>
                        <div class="text-xs text-gray-600">${hora.period}</div>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">${cita.paciente?.nombres || 'N/A'} ${cita.paciente?.apellidos || ''}</h4>
                                <p class="text-sm text-gray-600">
                                    <i class="${tipoCitaIcon} mr-1 text-emerald-500"></i>
                                    ${cita.tipoCita?.nombre || 'Consulta General'}
                                </p>
                                <p class="text-xs text-gray-500 mt-1">
                                    <i class="fas fa-user-md mr-1"></i>
                                    Dr. ${cita.odontologo?.nombre || 'N/A'} ${cita.odontologo?.apellido || ''}
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${statusText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        timelineContainer.innerHTML = citasHTML;

    } catch (error) {
        console.error('Error al cargar timeline del día:', error);
        timelineContainer.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-3xl mb-3"></i>
                <p>Error al cargar las citas del día</p>
                <button class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors" onclick="updateTodayTimeline()">
                    <i class="fas fa-redo mr-2"></i>
                    Reintentar
                </button>
            </div>
        `;
    }
}

/**
 * Carga la lista de citas
 */
async function loadAppointments() {
    try {
        console.log('📅 Cargando citas desde el servidor...');

        // Cargar citas usando la API
        const citas = await CitasAPI.getAllCitas();

        // Guardar caché para apertura instantánea de ver/editar (sin loader)
        AppointmentsModule.cachedCitas = Array.isArray(citas) ? citas : [];

        // Poblar filtro de odontólogos con datos reales (una sola vez)
        try {
            const odoFilter = document.querySelectorAll('#filtersSection select')[1];
            if (odoFilter && odoFilter.options.length <= 4) {
                const odosResp = await fetch('/api/odontologos');
                if (odosResp.ok) {
                    const odos = await odosResp.json();
                    if (Array.isArray(odos) && odos.length > 0) {
                        const current = odoFilter.value;
                        odoFilter.innerHTML = '<option value="">Todos los odontólogos</option>';
                        odos.forEach(function (o) {
                            const op = document.createElement('option');
                            op.value = o.id;
                            op.textContent = 'Dr. ' + (((o.nombre || '') + ' ' + (o.apellido || '')).trim() || ('#' + o.id));
                            odoFilter.appendChild(op);
                        });
                        odoFilter.value = current;
                    }
                }
            }
        } catch (e) { /* se conservan las opciones base */ }

        console.log('✅ Citas cargadas exitosamente:', citas.length, 'citas encontradas');

        // Paginación real del lado cliente
        TablePager.register('citas', function (page, pageSize) {
            if (pageSize) AppointmentsModule.pagination.itemsPerPage = pageSize;
            AppointmentsModule.pagination.currentPage = page;
            const pg = TablePager.paginate(getFilteredCitas(), page, AppointmentsModule.pagination.itemsPerPage);
            AppointmentsModule.pagination.currentPage = pg.page;
            updateAppointmentsTable(pg.rows);
            TablePager.renderBar('citasPager', pg, 'citas');
        });
        const citasPager = TablePager.paginate(getFilteredCitas(), AppointmentsModule.pagination.currentPage, AppointmentsModule.pagination.itemsPerPage);
        AppointmentsModule.pagination.currentPage = citasPager.page;
        AppointmentsModule.pagination.totalItems = citasPager.total;

        // Actualizar la tabla de citas
        updateAppointmentsTable(citasPager.rows);
        TablePager.renderBar('citasPager', citasPager, 'citas');

        // Actualizar estadísticas
        updateAppointmentStats(citas);

        // Actualizar timeline del día
        await updateTodayTimeline();

        return citas;

    } catch (error) {
        console.error('❌ Error al cargar citas:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo cargar la lista de citas. Por favor, verifique su conexión e intente nuevamente.',
            confirmButtonColor: '#dc2626'
        });

        // Devolver array vacío en caso de error
        return [];
    }
}

/**
 * Configura los filtros
 */
function setupFilters() {
    console.log('🔍 Filtros de citas configurados');
}

/**
 * Alternar visibilidad de filtros
 */
function toggleFilters() {
    const filtersSection = document.getElementById('filtersSection');
    const filterButton = document.querySelector('button[onclick="toggleFilters()"]');

    if (filtersSection) {
        const isHidden = filtersSection.classList.contains('hidden');

        if (isHidden) {
            filtersSection.classList.remove('hidden');
            filterButton?.classList.add('active');
        } else {
            filtersSection.classList.add('hidden');
            filterButton?.classList.remove('active');
        }
    }
}

function citasWeekRange() {
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // lunes = 0
    const mon = new Date(now);
    mon.setDate(now.getDate() - day);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const key = function (d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    return { from: key(mon), to: key(sun) };
}

function getFilteredCitas() {
    const list = AppointmentsModule.cachedCitas || [];
    const f = AppointmentsModule.filters || {};
    const q = String(f.search || '').trim().toLowerCase();
    const now = new Date();
    const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const week = (f.fecha === 'esta-semana') ? citasWeekRange() : null;
    return list.filter(function (cita) {
        if (q) {
            const hay = [
                cita.paciente && cita.paciente.nombres,
                cita.paciente && cita.paciente.apellidos,
                cita.paciente && cita.paciente.documento,
                cita.paciente && cita.paciente.email,
                cita.odontologo && cita.odontologo.nombre,
                cita.odontologo && cita.odontologo.apellido
            ].map(function (v) { return String(v || '').toLowerCase(); }).join(' | ');
            if (hay.indexOf(q) === -1) return false;
        }
        if (f.estado && String(cita.estado || '') !== f.estado) return false;
        if (f.odontologo && String((cita.odontologo && cita.odontologo.id) || '') !== String(f.odontologo)) return false;
        if (f.fecha && f.fecha !== 'personalizada') {
            const key = String(cita.fecha || '').slice(0, 10);
            if (f.fecha === 'hoy' && key !== todayKey) return false;
            if (f.fecha === 'esta-semana' && (key < week.from || key > week.to)) return false;
            if (f.fecha === 'este-mes' && key.slice(0, 7) !== todayKey.slice(0, 7)) return false;
        }
        return true;
    });
}

function renderCitasFiltradas() {
    const filtered = getFilteredCitas();
    const pager = TablePager.paginate(filtered, AppointmentsModule.pagination.currentPage, AppointmentsModule.pagination.itemsPerPage);
    AppointmentsModule.pagination.currentPage = pager.page;
    AppointmentsModule.pagination.totalItems = pager.total;
    updateAppointmentsTable(pager.rows);
    TablePager.renderBar('citasPager', pager, 'citas');
}

/**
 * Aplicar filtros de búsqueda
 */
function applyFilters() {
    const filtersSection = document.getElementById('filtersSection');

    if (filtersSection) {
        const searchInput = filtersSection.querySelector('input[type="text"]');
        const estadoSelect = filtersSection.querySelectorAll('select')[0];
        const odontologoSelect = filtersSection.querySelectorAll('select')[1];
        const fechaSelect = filtersSection.querySelectorAll('select')[2];

        AppointmentsModule.filters = {
            search: searchInput?.value || '',
            estado: estadoSelect?.value || '',
            odontologo: odontologoSelect?.value || '',
            fecha: fechaSelect?.value || ''
        };

        console.log('🔍 Aplicando filtros:', AppointmentsModule.filters);

        // Filtrado real sobre la caché (sin recarga ni mensajes simulados)
        AppointmentsModule.pagination.currentPage = 1;
        renderCitasFiltradas();
    }
}

/**
 * Limpiar filtros
 */
function clearFilters() {
    const filtersSection = document.getElementById('filtersSection');

    if (filtersSection) {
        const inputs = filtersSection.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.value = '';
        });

        AppointmentsModule.filters = {
            search: '',
            estado: '',
            odontologo: '',
            fecha: ''
        };

        console.log('🧹 Filtros limpiados');

        AppointmentsModule.pagination.currentPage = 1;
        renderCitasFiltradas();
    }
}

/**
 * Maneja la búsqueda en tiempo real (filtra la caché sin recargar)
 */
function handleSearchInput(e) {
    const query = e.target.value.trim();
    console.log('🔍 Búsqueda en tiempo real:', query);

    AppointmentsModule.filters.search = query;
    AppointmentsModule.pagination.currentPage = 1;
    renderCitasFiltradas();
}

/**
 * Toggle del menú móvil
 */
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

/**
 * Muestra mensaje de bienvenida
 */
function showWelcomeMessage() {
    console.log('👋 Bienvenido al módulo de citas médicas');
}

// ===============================
// FUNCIONES UTILITARIAS
// ===============================

/**
 * Formatear fecha para visualización
 */
function formatDate(dateString) {
    // Si viene una fecha en formato ISO (YYYY-MM-DD), usar parsing local
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Para otros formatos, usar el comportamiento normal
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Formatear fecha larga
 */
function formatDateLong(date) {
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formatear hora para el timeline
 */
function formatTime(timeString) {
    if (!timeString) return { time: '00:00', period: 'AM' };

    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return {
        time: `${displayHour.toString().padStart(2, '0')}:${minutes}`,
        period: period
    };
}

/**
 * Obtener icono para tipo de cita
 */
function getTipoCitaIcon(tipoCitaNombre) {
    const iconMap = {
        'Consulta General': 'fas fa-stethoscope',
        'Limpieza Dental': 'fas fa-tooth',
        'Endodoncia': 'fas fa-procedures',
        'Cirugía Oral': 'fas fa-cut',
        'Ortodoncia': 'fas fa-smile',
        'Periodoncia': 'fas fa-heart',
        'Odontología Estética': 'fas fa-star',
        'Urgencia': 'fas fa-exclamation-triangle'
    };

    return iconMap[tipoCitaNombre] || 'fas fa-calendar-check';
}

/**
 * Obtener nombre del paciente por ID
 */

// Nota: se eliminaron los mapas estáticos de pacientes/odontólogos.
// Ahora se usan las APIs reales (`CitasAPI`) para obtener datos de pacientes, odontólogos y citas.

/**
 * Obtener imagen de perfil según el género del paciente
 */
function getPatientProfileImage(gender, sizeClasses = 'h-full w-full') {
    const normalizedGender = String(gender || '').trim().toUpperCase();
    const imagePath = normalizedGender.startsWith('F')
        ? '/Imagenes/perfil_dama.png'
        : '/Imagenes/perfil_hombre.png';

    return `<img src="${imagePath}" alt="Perfil del paciente" class="${sizeClasses} rounded-full object-cover">`;
}

/**
 * Obtener datos de una cita desde la API por ID
 */
async function getAppointmentData(appointmentId) {
    try {
        // Preferir caché (sin loader ni petición)
        const cached = (AppointmentsModule.cachedCitas || []).find(c => String(c.id) === String(appointmentId));
        if (cached) return cached;
        const appointment = await CitasAPI.getCitaById(appointmentId);
        return appointment;
    } catch (error) {
        console.error('Error al obtener datos de la cita:', error);
        return null;
    }
}

/**
 * Helper: normaliza campos usados en los diálogos (maneja distintas formas de respuesta)
 */
function normalizeAppointmentForDialogs(appointment) {
    if (!appointment) return { pacienteNombre: 'Paciente', fechaCita: '', horaCita: '' };

    const pacienteNombre = appointment.paciente
        ? `${appointment.paciente.nombres || ''} ${appointment.paciente.apellidos || ''}`.trim()
        : (appointment.pacienteNombre || 'Paciente');

    const fechaCita = appointment.fecha || appointment.fechaCita || '';
    const horaCita = appointment.hora || appointment.horaCita || '';

    return { pacienteNombre, fechaCita, horaCita };
}

/**
 * Helper: formatea la hora para ser compatible con el select del formulario
 */
function formatTimeForSelect(timeValue) {
    if (!timeValue) return '';

    console.log('Formateando hora:', timeValue, 'Tipo:', typeof timeValue);

    // Si es un string, procesarlo
    if (typeof timeValue === 'string') {
        // Si viene en formato ISO o con segundos (HH:mm:ss), extraer solo HH:mm
        if (timeValue.includes(':')) {
            const timeParts = timeValue.split(':');
            if (timeParts.length >= 2) {
                const formattedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
                console.log('Hora formateada:', formattedTime);
                return formattedTime;
            }
        }
        return timeValue;
    }

    // Si es un objeto LocalTime u otro formato, convertir a string
    if (typeof timeValue === 'object' && timeValue.hour !== undefined && timeValue.minute !== undefined) {
        const formattedTime = `${timeValue.hour.toString().padStart(2, '0')}:${timeValue.minute.toString().padStart(2, '0')}`;
        console.log('Hora desde objeto:', formattedTime);
        return formattedTime;
    }

    console.log('Hora sin procesar:', timeValue);
    return timeValue.toString();
}

/**
 * Función debounce para optimizar búsquedas
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Actualiza la tabla de citas con los datos del servidor
 */
function updateAppointmentsTable(citas) {
    const tableBody = document.querySelector('#citasTable tbody');
    if (!tableBody) return;

    if (citas.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-3 text-gray-300"></i>
                    <p>No se encontraron citas</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = citas.map(cita => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        ${getPatientProfileImage(cita.paciente.genero, 'h-10 w-10')}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                            ${cita.paciente.nombres} ${cita.paciente.apellidos}
                        </div>
                        <div class="text-sm text-gray-500">${cita.paciente.email || ''}</div>
                        <div class="md:hidden text-xs text-gray-400 mt-1">
                            Dr. ${cita.odontologo.nombre} • ${cita.tipoCita.nombre}
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatDate(cita.fecha)}</div>
                <div class="text-sm text-gray-500">${cita.hora}</div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                <div class="text-sm text-gray-900">${cita.odontologo.nombre} ${cita.odontologo.apellido}</div>
                <div class="text-sm text-gray-500">Dr. ${cita.odontologo.matricula}</div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                <span class="text-sm text-gray-900">${cita.tipoCita.nombre}</span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(cita.estado)}">
                    ${getStatusText(cita.estado)}
                </span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="sys-table-actions">
                    <button onclick="viewAppointment(${cita.id})" class="sys-table-action sys-table-action-view" title="Ver detalles" aria-label="Ver detalles">
                        <i class="fas fa-eye text-sm"></i>
                    </button>
                    ${(() => { const bloqueada = esNoAsistida(cita); return `<button ${bloqueada ? 'disabled' : `onclick="editAppointment(${cita.id})"`} class="sys-table-action sys-table-action-edit ${bloqueada ? 'opacity-40 cursor-not-allowed' : ''}" title="${bloqueada ? 'Cita no asistida: estado terminal e inmutable' : 'Editar'}" aria-label="Editar"><i class="fas fa-edit text-sm ${bloqueada ? 'text-gray-300' : ''}"></i></button>`; })()}
                    ${(() => { const ok = puedeConfirmarCita(cita); return `<button ${ok ? `onclick="confirmAppointment(${cita.id})"` : 'disabled'} class="sys-table-action ${ok ? 'sys-table-action-confirm' : 'opacity-40 cursor-not-allowed'}" title="${ok ? 'Confirmar cita (solo hoy, antes de su hora)' : 'La confirmación se habilita el mismo día de la cita, antes de su hora'}" aria-label="Confirmar cita"><i class="fas fa-check-circle text-sm ${ok ? 'text-emerald-600' : 'text-gray-300'}"></i></button>`; })()}
                    ${(() => { const ok = puedeEnviarRecordatorio(cita); const ya = cita.recordatorioEnviado === true; return `<button ${ok ? `onclick="sendReminderAppointment(${cita.id})"` : 'disabled'} class="sys-table-action ${ok ? 'sys-table-action-remind' : 'opacity-40 cursor-not-allowed'}" title="${ok ? (ya ? 'Reenviar recordatorio por correo (un día antes)' : 'Enviar recordatorio por correo (un día antes)') : 'El recordatorio se habilita únicamente un día antes de la cita'}" aria-label="Enviar recordatorio"><i class="fas fa-bell text-sm ${ok ? 'text-amber-500' : 'text-gray-300'}"></i></button>`; })()}
                    ${(() => { const ok = puedeFinalizarCita(cita); return `<button ${ok ? `onclick="finalizeAppointment(${cita.id})"` : 'disabled'} class="sys-table-action ${ok ? 'sys-table-action-finish' : 'opacity-40 cursor-not-allowed'}" title="${ok ? 'Finalizar cita (odontólogo, tras la atención)' : 'Solo el odontólogo finaliza una cita confirmada pasada su fecha/hora'}" aria-label="Finalizar cita"><i class="fas fa-flag-checkered text-sm ${ok ? 'text-blue-600' : 'text-gray-300'}"></i></button>`; })()}
                    ${(() => { const bloqueada = esNoAsistida(cita); return `<button ${bloqueada ? 'disabled' : `onclick="deleteAppointment(${cita.id})"`} class="sys-table-action sys-table-action-delete ${bloqueada ? 'opacity-40 cursor-not-allowed' : ''}" title="${bloqueada ? 'Cita no asistida: estado terminal e inmutable' : 'Eliminar'}" aria-label="Eliminar"><i class="fas fa-trash text-sm ${bloqueada ? 'text-gray-300' : ''}"></i></button>`; })()}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Actualiza las estadísticas de citas
 */
function updateAppointmentStats(citas) {
    const list = Array.isArray(citas) ? citas : [];
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Conteos reales en el orden de las tarjetas: hoy, pendientes, completadas, canceladas
    const values = [
        list.filter(cita => cita.fecha === today).length,
        list.filter(cita => cita.estado === 'PENDIENTE').length,
        list.filter(cita => {
            const citaDate = new Date(cita.fecha);
            return cita.estado === 'FINALIZADA' &&
                   citaDate.getMonth() === now.getMonth() &&
                   citaDate.getFullYear() === now.getFullYear();
        }).length,
        list.filter(cita => cita.estado === 'CANCELADA').length
    ];

    const cards = document.querySelectorAll('.sys-stat-card .sys-stat-value');
    cards.forEach(function (el, i) {
        if (values[i] !== undefined) el.textContent = values[i].toLocaleString();
    });
}

/**
 * Obtiene el color del estado de la cita
 */
function getStatusColor(estado) {
    const colors = {
        'PENDIENTE': 'bg-yellow-100 text-yellow-800',
        'CONFIRMADA': 'bg-green-100 text-green-800',
        'REPROGRAMADA': 'bg-purple-100 text-purple-800',
        'FINALIZADA': 'bg-blue-100 text-blue-800',
        'NO_ASISTIDA': 'bg-gray-100 text-gray-800',
        'CANCELADA': 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el texto del estado de la cita
 */
function getStatusText(estado) {
    const texts = {
        'PENDIENTE': 'Pendiente',
        'CONFIRMADA': 'Confirmada',
        'REPROGRAMADA': 'Reprogramada',
        'FINALIZADA': 'Finalizada',
        'NO_ASISTIDA': 'No asistida',
        'CANCELADA': 'Cancelada'
    };
    return texts[estado] || estado;
}

/**
 * Elimina una cita
 */
async function deleteAppointment(citaId) {
    const cached = (AppointmentsModule.cachedCitas || []).find(c => String(c.id) === String(citaId));
    if (esNoAsistida(cached)) {
        Swal.fire({ icon: 'info', title: 'Cita no asistida', text: 'Estado terminal e inmutable: fue marcada automáticamente por el sistema y no se puede eliminar.', confirmButtonColor: '#4b5563' });
        return;
    }
    const result = await Swal.fire({
        title: '¿Eliminar cita?',
        html: `
            <div class="text-center">
                <div class="swal-delete-summary">
                    <div class="swal-delete-icon"><i class="fas fa-calendar-times"></i></div>
                    <p class="text-gray-700 mb-2"><strong>Eliminar esta cita</strong></p>
                    <p class="text-sm text-gray-500">La cita seleccionada y su programación</p>
                </div>
                <div class="swal-delete-warning">
                    <p class="text-red-800 text-sm">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <strong>Advertencia:</strong> Esta acción no se puede deshacer y eliminará:
                    </p>
                    <ul class="text-red-700 text-sm mt-2 text-left list-disc ml-6">
                        <li>La fecha y hora reservadas</li>
                        <li>La asignación del paciente y odontólogo</li>
                        <li>El consultorio y tipo de cita registrados</li>
                        <li>Las observaciones y datos de seguimiento</li>
                    </ul>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'swal-delete-modal' }
    });

    if (result.isConfirmed) {
        try {
            await CitasAPI.deleteCita(citaId);

            await Swal.fire({
                icon: 'success',
                title: 'Cita eliminada',
                text: 'La cita ha sido eliminada exitosamente',
                confirmButtonColor: '#10b981'
            });

            // Recargar lista
            await loadAppointments();

        } catch (error) {
            console.error('Error al eliminar cita:', error);

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: (error && error.message) ? String(error.message).slice(0, 400) : 'No se pudo eliminar la cita',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/**
 * Inicializa el paciente sin desplegar la lista completa.
 * El paciente se agrega únicamente después de buscarlo por cédula.
 */
async function loadPacientesSelect() {
    const select = document.getElementById('pacienteId');
    if (select && !select.value) {
        select.innerHTML = '<option value="">Ingrese la cédula para buscar...</option>';
    }
}

/** Normaliza texto (minúsculas, sin tildes) para comparar especialidades. */
function normTxtCitas(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Etiqueta legible del odontólogo con su especialidad. */
function etiquetaOdontologo(o) {
    const nombre = `Dr. ${(o.nombre || '').trim()} ${(o.apellido || '').trim()}`.trim();
    const esp = (o.especialidades || '').trim();
    return esp ? `${nombre} — ${esp}` : nombre;
}

/** Pinta el select de odontólogos con una lista dada. */
function pintarOdontologos(lista, selectedId) {
    const select = document.getElementById('odontologoId');
    if (!select) return;
    if (!Array.isArray(lista) || lista.length === 0) {
        select.innerHTML = '<option value="">Sin odontólogos para esta especialidad</option>';
        return;
    }
    select.innerHTML = '<option value="">Seleccionar odontólogo...</option>';
    lista.forEach(o => {
        const option = document.createElement('option');
        option.value = o.id;
        option.textContent = etiquetaOdontologo(o);
        select.appendChild(option);
    });
    if (selectedId) select.value = selectedId;
}

/**
 * Carga la lista de odontólogos en el select.
 * Si se indica especialidadNombre, filtra por esa especialidad (tipo de cita).
 */
async function loadOdontologosSelect(especialidadNombre, selectedId, soloCache) {
    try {
        let odontologos = AppointmentsModule.cachedOdontologos || [];
        if (odontologos.length === 0) {
            const response = await fetch('/api/odontologos');
            if (!response.ok) throw new Error('Error al cargar odontólogos');
            odontologos = await response.json();
            AppointmentsModule.cachedOdontologos = Array.isArray(odontologos) ? odontologos : [];
        }
        if (soloCache) return AppointmentsModule.cachedOdontologos;
        if (especialidadNombre) {
            await filtrarOdontologosPorEspecialidad(especialidadNombre, false, selectedId);
        } else {
            pintarOdontologos(AppointmentsModule.cachedOdontologos, selectedId);
        }
        return AppointmentsModule.cachedOdontologos;
    } catch (error) {
        console.error('Error al cargar odontólogos:', error);
        const select = document.getElementById('odontologoId');
        if (select) {
            select.innerHTML = '<option value="">Error al cargar odontólogos</option>';
        }
        return [];
    }
}

/**
 * Filtra los odontólogos por la especialidad elegida en Tipo de Cita.
 * Usa el endpoint /api/odontologos/por-especialidad con respaldo local.
 */
async function filtrarOdontologosPorEspecialidad(especialidadNombre, silencioso, selectedId) {
    const select = document.getElementById('odontologoId');
    const hint = document.getElementById('odontologoFiltroHint');
    const esp = String(especialidadNombre || '').trim();
    if (!esp || /^seleccionar/i.test(esp)) {
        if (select) select.innerHTML = '<option value="">Seleccione primero la especialidad...</option>';
        if (hint) hint.textContent = 'Se muestran solo los odontólogos de la especialidad elegida.';
        return [];
    }
    try {
        const filtrados = await CitasAPI.getOdontologosPorEspecialidad(esp);
        pintarOdontologos(filtrados, selectedId);
        if (hint) hint.textContent = filtrados.length > 0
            ? `${filtrados.length} odontólogo(s) con especialidad en ${esp}.`
            : `No hay odontólogos registrados con especialidad en ${esp}.`;
        return filtrados;
    } catch (e) {
        // Respaldo local insensible a tildes
        const normEsp = normTxtCitas(esp);
        const locales = (AppointmentsModule.cachedOdontologos || []).filter(o => normTxtCitas(o.especialidades).includes(normEsp));
        pintarOdontologos(locales, selectedId);
        if (!silencioso && locales.length === 0) console.warn('Sin odontólogos locales para:', esp);
        return locales;
    }
}

/** Al cambiar el Tipo de Cita (especialidad) se recargan los odontólogos asociados. */
async function onTipoCitaChange() {
    const tipoSelect = document.getElementById('tipoCitaId');
    const nombre = tipoSelect?.selectedOptions?.[0]?.textContent || '';
    await filtrarOdontologosPorEspecialidad(nombre, false);
    // Sin odontólogo elegido no hay calendario: se refresca el hint de días
    CalendarioCita.odoId = '';
    CalendarioCita.cache = {};
    cerrarCalendarioCita();
    const fechaInput = document.getElementById('fechaCita');
    if (fechaInput && !AppointmentsModule.editMode) fechaInput.value = '';
    actualizarHintDias();
    await actualizarHorasDisponibles();
}

/** Asegura que un paciente exista como opción del select (edición). */
async function ensurePacienteOption(pacienteId, paciente) {
    const select = document.getElementById('pacienteId');
    if (!select) return;
    if (Array.from(select.options).some(o => String(o.value) === String(pacienteId))) return;
    if (paciente && paciente.nombres) {
        const option = document.createElement('option');
        option.value = pacienteId;
        option.textContent = `${paciente.nombres} ${paciente.apellidos || ''} · CC ${paciente.documento || ''}`;
        select.appendChild(option);
        return;
    }
    try {
        const p = await (await fetch(`/api/pacientes/${pacienteId}`)).json();
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nombres} ${p.apellidos} · CC ${p.documento || ''}`;
        select.appendChild(option);
    } catch (e) { /* noop */ }
}

/** Asegura que un odontólogo exista como opción del select (edición). */
async function ensureOdontologoOption(odontologoId, odontologo) {
    const select = document.getElementById('odontologoId');
    if (!select) return;
    const nombre = odontologo && (odontologo.nombre || odontologo.nombres)
        ? etiquetaOdontologo({ nombre: odontologo.nombre || odontologo.nombres, apellido: odontologo.apellido || odontologo.apellidos, especialidades: odontologo.especialidades || '' })
        : `Odontólogo #${odontologoId}`;
    const option = document.createElement('option');
    option.value = odontologoId;
    option.textContent = nombre;
    select.appendChild(option);
}

/** Muestra un resultado inline únicamente cuando la búsqueda no encuentra paciente. */
function mostrarPacientePreview(paciente) {
    const el = document.getElementById('pacienteNombrePreview');
    if (!el) return;
    if (!paciente) {
        el.textContent = '';
        el.classList.add('hidden');
    }
}

/**
 * Busca el paciente por la cédula digitada y lo deja seleccionado.
 */
async function buscarPacientePorCedula() {
    const cedulaInput = document.getElementById('cedulaPaciente');
    const select = document.getElementById('pacienteId');
    const cedula = String(cedulaInput?.value || '').trim();
    if (!cedula) {
        Swal.fire({ icon: 'warning', title: 'Ingrese la cédula', text: 'Digite la cédula del paciente para buscarlo.', confirmButtonColor: '#f59e0b' });
        cedulaInput?.focus();
        return;
    }
    try {
        Swal.fire({ title: 'Buscando paciente...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const paciente = await CitasAPI.getPacientePorDocumento(cedula);
        Swal.close();
        await ensurePacienteOption(paciente.id, paciente);
        if (select) select.value = paciente.id;
        if (cedulaInput) cedulaInput.value = paciente.documento || cedula;
        mostrarPacientePreview(null);
        Swal.fire({
            icon: 'success',
            title: 'Paciente encontrado',
            text: `${paciente.nombres} ${paciente.apellidos}`,
            timer: 1600,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Paciente no encontrado por cédula:', error);
        Swal.close();
        const preview = document.getElementById('pacienteNombrePreview');
        if (preview) {
            preview.textContent = 'No se encontró un paciente con esa cédula.';
            preview.classList.remove('hidden', 'text-emerald-700');
            preview.classList.add('text-red-600');
        }
        Swal.fire({
            icon: 'error',
            title: 'Paciente no encontrado',
            text: `No existe un paciente con cédula ${cedula}. Verifíquela o regístrelo en el módulo de Pacientes.`,
            confirmButtonColor: '#dc2626'
        });
    }
}

/** Clave local YYYY-MM-DD de una fecha. */
function claveFechaLocal(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * Regla del botón de confirmación: bloqueado por defecto,
 * se habilita el mismo día de la cita antes de su hora y en estado
 * PENDIENTE o REPROGRAMADA.
 */
function puedeConfirmarCita(cita) {
    if (!cita) return false;
    const estado = String(cita.estado || '').toUpperCase();
    if (estado !== 'PENDIENTE' && estado !== 'REPROGRAMADA') return false;
    if (citaVencida(cita)) return false;
    const fechaStr = String(cita.fecha || cita.fechaCita || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return false;
    if (fechaStr !== claveFechaLocal(new Date())) return false;
    const horaStr = String(cita.hora || cita.horaCita || '').slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(horaStr)) return true;
    const ahora = new Date();
    const hhmmActual = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
    return hhmmActual < horaStr;
}

/**
 * Vencida = ya pasó 1 minuto desde la fecha/hora asignada.
 * Sin fecha/hora válida no se considera vencida.
 */
function citaVencida(cita) {
    if (!cita) return false;
    const fechaStr = String(cita.fecha || cita.fechaCita || '').slice(0, 10);
    const horaStr = String(cita.hora || cita.horaCita || '').slice(0, 5);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr) || !/^\d{2}:\d{2}$/.test(horaStr)) return false;
    const turno = new Date(fechaStr + 'T' + horaStr + ':00');
    if (isNaN(turno.getTime())) return false;
    return Date.now() >= turno.getTime() + 60 * 1000;
}

/**
 * Regla del botón Finalizar (lo realiza el odontólogo):
 * estado CONFIRMADA y fecha/hora ya pasada.
 */
function puedeFinalizarCita(cita) {
    if (!cita) return false;
    if (String(cita.estado || '').toUpperCase() !== 'CONFIRMADA') return false;
    const fechaStr = String(cita.fecha || cita.fechaCita || '').slice(0, 10);
    const horaStr = String(cita.hora || cita.horaCita || '').slice(0, 5);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return false;
    const hoyStr = claveFechaLocal(new Date());
    if (fechaStr < hoyStr) return true;
    if (fechaStr > hoyStr) return false;
    if (!/^\d{2}:\d{2}$/.test(horaStr)) return true;
    const ahora = new Date();
    const hhmmActual = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
    return hhmmActual >= horaStr;
}

/**
 * NO_ASISTIDA es terminal e inmutable: la marca automáticamente el sistema
 * 1 minuto después de la fecha/hora sin asistencia. Sin acción manual:
 * editar, cancelar y eliminar quedan bloqueados.
 */
function esNoAsistida(cita) {
    return !!cita && String(cita.estado || '').toUpperCase() === 'NO_ASISTIDA';
}

/**
 * Regla del botón de recordatorio por correo: bloqueado por defecto,
 * se habilita únicamente un día antes de la cita (fecha == mañana)
 * y en estado PENDIENTE, CONFIRMADA o REPROGRAMADA. Independiente de la confirmación.
 */
function puedeEnviarRecordatorio(cita) {
    if (!cita) return false;
    const estado = String(cita.estado || '').toUpperCase();
    if (estado !== 'PENDIENTE' && estado !== 'CONFIRMADA' && estado !== 'REPROGRAMADA') return false;
    const fechaStr = String(cita.fecha || cita.fechaCita || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return false;
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return fechaStr === claveFechaLocal(manana);
}

/**
 * Carga la lista de tipos de cita en el select
 */
async function loadTiposCitaSelect() {
    try {
        console.log('Cargando tipos de cita...');
        const response = await fetch('/api/tipos-cita');
        if (!response.ok) throw new Error('Error al cargar tipos de cita');

        const tiposCita = await response.json();
        console.log('Tipos de cita cargados:', tiposCita);

        const select = document.getElementById('tipoCitaId');

        if (select) {
            select.innerHTML = '<option value="">Seleccionar tipo de cita...</option>';

            // Si la API devuelve vacío, usar fallback local (útil en dev o cuando no hay seed en BD)
            const source = (Array.isArray(tiposCita) && tiposCita.length > 0) ? tiposCita : AppointmentsModule.appointmentTypes.map(t => ({ id: t.id, nombre: t.name }));

            if (!Array.isArray(tiposCita) || tiposCita.length === 0) {
                console.warn('loadTiposCitaSelect: la API no devolvió tipos de cita, usando fallback local');
            }

            source.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nombre || tipo.name || tipo.descripcion || tipo.id;
                select.appendChild(option);
            });
            AppointmentsModule.cachedTiposCita = source;
        }
    } catch (error) {
        console.error('Error al cargar tipos de cita:', error);
        // Si falla, mostrar opción por defecto
        const select = document.getElementById('tipoCitaId');
        if (select) {
            // usar fallback local si existe
            select.innerHTML = '<option value="">Seleccionar tipo de cita...</option>';
            AppointmentsModule.appointmentTypes.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.name;
                select.appendChild(option);
            });
        }
    }
}

// Exportar funciones principales para uso global
window.AppointmentsModule = AppointmentsModule;
window.CitasAPI = CitasAPI;
window.openNewAppointmentModal = openNewAppointmentModal;
window.closeNewAppointmentModal = closeNewAppointmentModal;
window.viewAppointment = viewAppointment;
window.closeViewAppointmentModal = closeViewAppointmentModal;
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.confirmAppointment = confirmAppointment;
window.confirmAppointmentFromModal = confirmAppointmentFromModal;
window.finalizeAppointment = finalizeAppointment;
window.finalizeAppointmentFromModal = finalizeAppointmentFromModal;
window.citaVencida = citaVencida;
window.esNoAsistida = esNoAsistida;
window.puedeFinalizarCita = puedeFinalizarCita;
window.sendReminderAppointment = sendReminderAppointment;
window.sendReminderFromModal = sendReminderFromModal;
window.puedeConfirmarCita = puedeConfirmarCita;
window.puedeEnviarRecordatorio = puedeEnviarRecordatorio;
window.buscarPacientePorCedula = buscarPacientePorCedula;
window.onTipoCitaChange = onTipoCitaChange;
window.actualizarHorasDisponibles = actualizarHorasDisponibles;
window.filtrarOdontologosPorEspecialidad = filtrarOdontologosPorEspecialidad;
window.calCitaCambiarMes = calCitaCambiarMes;
window.elegirFechaCita = elegirFechaCita;
window.cerrarCalendarioCita = cerrarCalendarioCita;
window.cancelAppointment = cancelAppointment;
window.openCalendarView = openCalendarView;
window.printAppointment = printAppointment;
window.printCitaById = printCitaById;
window.goToPreviousDay = goToPreviousDay;
window.goToNextDay = goToNextDay;
window.goToToday = goToToday;
window.toggleFilters = toggleFilters;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;

/* Cierre de modales de acción con clic fuera o tecla Escape */
(function () {
    var ACTION_MODALS = [
        { id: 'newAppointmentModal', close: closeNewAppointmentModal },
        { id: 'viewAppointmentModal', close: closeViewAppointmentModal }
    ];

    function modalIsOpen(modal) {
        if (!modal) return false;
        if (modal.classList.contains('show')) return true;
        return !modal.classList.contains('hidden') && modal.style.display !== 'none';
    }

    function closeEntry(entry) {
        try { entry.close(); } catch (e) { /* noop */ }
    }

    document.addEventListener('click', function (event) {
        const t = event.target;
        if (!t || !t.classList || !t.classList.contains('fixed') || !t.classList.contains('inset-0') || !t.id) return;
        const entry = ACTION_MODALS.find(function (e) { return e.id === t.id; });
        if (entry && modalIsOpen(t)) closeEntry(entry);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        if (window.Swal && typeof window.Swal.isVisible === 'function' && window.Swal.isVisible()) return;
        ACTION_MODALS.forEach(function (entry) {
            const modal = document.getElementById(entry.id);
            if (modalIsOpen(modal)) closeEntry(entry);
        });
    });
})();
