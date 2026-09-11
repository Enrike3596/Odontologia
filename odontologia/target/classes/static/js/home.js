/**
 * Sistema Dashboard - Clínica Odontológica
 * Panel principal con estadísticas, gráficas y resumen de actividades.
 * Todos los datos provienen de las APIs del sistema (sin información ficticia).
 */

// Estado global del módulo dashboard
const DashboardModule = {
    charts: {
        appointments: null,
        treatments: null
    },
    updateInterval: null,
    refreshRate: 300000, // 5 minutos
    isUpdating: false,
    citas: [],
    pacientes: [],
    odontologos: [],
    historias: [],
    alerts: [],
    currentStats: {
        todayAppointments: 0,
        activePatients: 0,
        totalRecords: 0,
        availableDoctors: 0
    }
};

const DASH_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DASH_CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.dataset.page === 'dashboard') {
        initializeDashboard();
    }
});

/**
 * Inicializa el dashboard principal
 */
function initializeDashboard() {
    console.log('📊🦷 Inicializando Dashboard de Clínica Odontológica');

    // Configurar eventos
    setupEventListeners();

    // Cargar datos iniciales (reales)
    loadDashboardData();

    // Inicializar gráficas (vacías; se llenan al llegar los datos)
    initializeCharts();

    // Configurar actualización automática
    setupAutoRefresh();

    // Actualizar fecha actual
    updateCurrentDate();

    // Mostrar mensaje de bienvenida
    showWelcomeMessage();
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Formulario de cita rápida
    const quickAppointmentForm = document.getElementById('quickAppointmentForm');
    if (quickAppointmentForm) {
        quickAppointmentForm.addEventListener('submit', handleQuickAppointmentSubmit);
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Auto-refresh cuando la página vuelve a estar visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && !DashboardModule.isUpdating) {
            refreshDashboard();
        }
    });
}

/* ===============================
   UTILIDADES DE DATOS REALES
   =============================== */

async function apiGet(url) {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error('HTTP ' + response.status + ' en ' + url);
    return response.json();
}

function esc(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
}

function todayKey(date) {
    const p = function (n) { return String(n).padStart(2, '0'); };
    return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate());
}

function citaDateKey(cita) {
    return String((cita && cita.fecha) || '').slice(0, 10);
}

function horaCorta(hora) {
    return String(hora || '').slice(0, 5);
}

function fmtHora12(hora) {
    const h = horaCorta(hora).split(':');
    let hh = parseInt(h[0], 10);
    const mm = h[1] || '00';
    if (isNaN(hh)) return { time: '--:--', period: '' };
    const period = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return { time: String(hh).padStart(2, '0') + ':' + mm, period: period };
}

function fmtFechaCorta(fechaKey) {
    const parts = String(fechaKey || '').split('-');
    if (parts.length < 3) return String(fechaKey || '');
    return parseInt(parts[2], 10) + ' ' + (DASH_MESES[parseInt(parts[1], 10) - 1] || '');
}

function estadoMeta(estado) {
    switch (String(estado || '').toUpperCase()) {
        case 'CONFIRMADA':
            return { text: 'Confirmada', badge: 'bg-green-100 text-green-800', dot: 'bg-green-500', row: 'bg-green-50 border-green-200', time: 'text-green-700', sub: 'text-green-600', icon: 'text-green-500' };
        case 'COMPLETADA':
            return { text: 'Completada', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500', row: 'bg-blue-50 border-blue-200', time: 'text-blue-700', sub: 'text-blue-600', icon: 'text-blue-500' };
        case 'CANCELADA':
            return { text: 'Cancelada', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500', row: 'bg-red-50 border-red-200', time: 'text-red-700', sub: 'text-red-600', icon: 'text-red-500' };
        case 'PENDIENTE':
        default:
            return { text: 'Pendiente', badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500', row: 'bg-yellow-50 border-yellow-200', time: 'text-yellow-700', sub: 'text-yellow-600', icon: 'text-yellow-500' };
    }
}

function nombrePaciente(p) {
    if (!p) return 'Sin paciente';
    const n = ((p.nombres || '') + ' ' + (p.apellidos || '')).trim();
    return n || 'Sin paciente';
}

function nombreOdontologo(o) {
    if (!o) return 'Por asignar';
    const n = ((o.nombre || '') + ' ' + (o.apellido || '')).trim();
    return n ? 'Odont. ' + n : 'Por asignar';
}

/**
 * Carga los datos reales del dashboard desde las APIs del sistema
 */
async function loadDashboardData() {
    try {
        console.log('📊 Cargando datos reales del dashboard...');

        const results = await Promise.all([
            apiGet('/api/citas').catch(function (e) { console.error(e); return []; }),
            apiGet('/api/pacientes').catch(function (e) { console.error(e); return []; }),
            apiGet('/api/odontologos').catch(function (e) { console.error(e); return []; }),
            apiGet('/api/historias-clinicas').catch(function (e) { console.error(e); return []; })
        ]);

        DashboardModule.citas = Array.isArray(results[0]) ? results[0] : [];
        DashboardModule.pacientes = Array.isArray(results[1]) ? results[1] : [];
        DashboardModule.odontologos = Array.isArray(results[2]) ? results[2] : [];
        DashboardModule.historias = Array.isArray(results[3]) ? results[3] : [];

        // Actualizar estadísticas
        updateStatistics();

        // Renderizar paneles
        renderTodayAgenda();
        renderStatusSummary();
        renderAlerts();
        renderUpcoming();

        // Actualizar gráficas con datos reales
        updateAppointmentsChart();
        updateTreatmentsChart();

        console.log('✅ Datos reales del dashboard cargados exitosamente');

    } catch (error) {
        console.error('❌ Error al cargar dashboard:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudieron cargar los datos del dashboard.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Actualiza las estadísticas principales con datos reales
 */
function updateStatistics() {
    const t = todayKey(new Date());
    const y = todayKey(new Date(Date.now() - 86400000));
    const monthPrefix = t.slice(0, 7);

    const citasHoy = DashboardModule.citas.filter(function (c) { return citaDateKey(c) === t; });
    const citasAyer = DashboardModule.citas.filter(function (c) { return citaDateKey(c) === y; }).length;
    const historiasMes = DashboardModule.historias.filter(function (h) {
        return String(h.fechaCreacion || '').slice(0, 7) === monthPrefix;
    }).length;

    const data = {
        todayAppointments: citasHoy.length,
        activePatients: DashboardModule.pacientes.length,
        totalRecords: DashboardModule.historias.length,
        availableDoctors: DashboardModule.odontologos.length
    };

    // Animar contadores
    animateCounter('todayAppointments', DashboardModule.currentStats.todayAppointments, data.todayAppointments);
    animateCounter('activePatients', DashboardModule.currentStats.activePatients, data.activePatients);
    animateCounter('totalRecords', DashboardModule.currentStats.totalRecords, data.totalRecords);
    animateCounter('availableDoctors', DashboardModule.currentStats.availableDoctors, data.availableDoctors);

    // Guardar estadísticas actuales
    DashboardModule.currentStats = data;

    // Tendencias reales bajo cada tarjeta (mismo orden del grid)
    const diff = data.todayAppointments - citasAyer;
    const trendTexts = [
        diff > 0 ? '+' + diff + ' vs ayer' : (diff === 0 ? 'Igual que ayer' : diff + ' vs ayer'),
        data.activePatients + ' registrados',
        historiasMes + ' este mes',
        data.availableDoctors + ' registrados'
    ];
    const trendSpans = document.querySelectorAll('#statsGrid .sys-stat-trend span');
    trendSpans.forEach(function (el, i) {
        if (trendTexts[i] !== undefined) el.textContent = trendTexts[i];
    });
}

/**
 * Anima un contador numérico
 */
function animateCounter(elementId, startValue, endValue, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startTime = Date.now();
    const valueRange = endValue - startValue;

    const updateCounter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Función de easing
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (valueRange * easeOutQuart));

        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    };

    requestAnimationFrame(updateCounter);
}

/**
 * Agenda del día con citas reales
 */
function renderTodayAgenda() {
    const container = document.getElementById('todayAppointmentsList');
    if (!container) return;

    const t = todayKey(new Date());
    const delDia = DashboardModule.citas
        .filter(function (c) { return citaDateKey(c) === t; })
        .sort(function (a, b) { return horaCorta(a.hora).localeCompare(horaCorta(b.hora)); });

    if (delDia.length === 0) {
        container.innerHTML =
            '<div class="text-center py-8 text-gray-500">' +
                '<i class="fas fa-calendar-alt text-3xl mb-3"></i>' +
                '<p>Sin citas programadas para hoy</p>' +
            '</div>';
        return;
    }

    const accents = ['emerald', 'blue', 'purple'];
    const shown = delDia.slice(0, 6);

    const html = shown.map(function (cita, i) {
        const a = accents[i % accents.length];
        const meta = estadoMeta(cita.estado);
        const h = fmtHora12(cita.hora);
        const tipo = (cita.tipoCita && cita.tipoCita.nombre) || 'Consulta General';
        return '' +
        '<div class="flex items-center p-4 bg-' + a + '-50 border border-' + a + '-200 rounded-lg hover:shadow-md transition-shadow">' +
            '<div class="flex-shrink-0 text-center mr-4">' +
                '<div class="text-sm font-semibold text-' + a + '-700">' + esc(h.time) + '</div>' +
                '<div class="text-xs text-' + a + '-600">' + esc(h.period) + '</div>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
                '<div class="flex items-center justify-between gap-2">' +
                    '<div class="min-w-0">' +
                        '<h4 class="font-medium text-gray-900 truncate">' + esc(nombrePaciente(cita.paciente)) + '</h4>' +
                        '<p class="text-sm text-gray-600 truncate">' +
                            '<i class="fas fa-tooth mr-1 text-' + a + '-500"></i>' +
                            esc(tipo) + ' - ' + esc(nombreOdontologo(cita.odontologo)) +
                        '</p>' +
                    '</div>' +
                    '<div class="flex items-center gap-2 flex-shrink-0">' +
                        '<span class="px-2 py-1 text-xs font-medium rounded-full ' + meta.badge + '">' + meta.text + '</span>' +
                        '<button class="p-2 text-blue-600 hover:bg-blue-100 rounded-full" onclick="viewAppointmentQuick(' + cita.id + ')" title="Ver detalles">' +
                            '<i class="fas fa-eye text-sm"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    const rest = delDia.length - shown.length;
    container.innerHTML = html +
        (rest > 0
            ? '<div class="text-center pt-4">' +
                '<button class="text-sm text-gray-500 hover:text-gray-700 underline" onclick="viewAllAppointments()">' +
                    'Ver las ' + rest + ' citas restantes del día' +
                '</button>' +
              '</div>'
            : '');
}

/**
 * Resumen por estado con citas reales (reemplaza consultorios ficticios)
 */
function renderStatusSummary() {
    const container = document.getElementById('statusSummaryList');
    if (!container) return;

    const counts = { PENDIENTE: 0, CONFIRMADA: 0, COMPLETADA: 0, CANCELADA: 0, OTROS: 0 };
    DashboardModule.citas.forEach(function (c) {
        const e = String(c.estado || '').toUpperCase();
        if (counts[e] !== undefined) counts[e]++;
        else counts.OTROS++;
    });

    const rows = [
        { label: 'Pendientes', count: counts.PENDIENTE, meta: estadoMeta('PENDIENTE') },
        { label: 'Confirmadas', count: counts.CONFIRMADA, meta: estadoMeta('CONFIRMADA') },
        { label: 'Completadas', count: counts.COMPLETADA, meta: estadoMeta('COMPLETADA') },
        { label: 'Canceladas', count: counts.CANCELADA, meta: estadoMeta('CANCELADA') }
    ];

    container.innerHTML = rows.map(function (r) {
        return '' +
        '<div class="flex items-center justify-between p-3 ' + r.meta.row + ' rounded-lg">' +
            '<div class="flex items-center">' +
                '<div class="w-3 h-3 ' + r.meta.dot + ' rounded-full mr-3"></div>' +
                '<span class="text-sm font-medium">' + r.label + '</span>' +
            '</div>' +
            '<span class="text-xs font-semibold px-2 py-1 rounded-full ' + r.meta.badge + '">' + r.count + '</span>' +
        '</div>';
    }).join('');
}

/* Alertas reales del sistema */
const DASH_ALERT_STYLES = {
    danger: { box: 'bg-red-50 border-red-200', icon: 'text-red-500', title: 'text-red-800', desc: 'text-red-600' },
    warn: { box: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-500', title: 'text-yellow-800', desc: 'text-yellow-600' },
    info: { box: 'bg-blue-50 border-blue-200', icon: 'text-blue-500', title: 'text-blue-800', desc: 'text-blue-600' },
    ok: { box: 'bg-green-50 border-green-200', icon: 'text-green-500', title: 'text-green-800', desc: 'text-green-600' }
};

function dashAlertRow(a) {
    const s = DASH_ALERT_STYLES[a.kind] || DASH_ALERT_STYLES.info;
    return '' +
    '<div class="flex items-start p-3 ' + s.box + ' border rounded-lg">' +
        '<i class="fas ' + a.icon + ' ' + s.icon + ' mt-1 mr-3"></i>' +
        '<div>' +
            '<p class="text-sm font-medium ' + s.title + '">' + esc(a.title) + '</p>' +
            '<p class="text-xs ' + s.desc + '">' + esc(a.desc) + '</p>' +
        '</div>' +
    '</div>';
}

function renderAlerts() {
    const container = document.getElementById('alertsList');
    const t = todayKey(new Date());
    const tomorrow = todayKey(new Date(Date.now() + 86400000));

    const pendHoy = DashboardModule.citas.filter(function (c) {
        return citaDateKey(c) === t && String(c.estado || '').toUpperCase() === 'PENDIENTE';
    }).length;
    const manana = DashboardModule.citas.filter(function (c) { return citaDateKey(c) === tomorrow; }).length;
    const activas = DashboardModule.citas.filter(function (c) {
        const e = String(c.estado || '').toUpperCase();
        return e === 'PENDIENTE' || e === 'CONFIRMADA';
    }).length;

    const alerts = [];
    if (pendHoy === 0 && manana === 0) {
        alerts.push({ kind: 'ok', icon: 'fa-check-circle', title: 'Agenda al día', desc: 'Sin citas pendientes por confirmar' });
    }
    if (pendHoy > 0) {
        alerts.push({ kind: 'danger', icon: 'fa-exclamation-triangle', title: 'Citas pendientes hoy', desc: pendHoy + ' por confirmar' });
    }
    if (manana > 0) {
        alerts.push({ kind: 'warn', icon: 'fa-clock', title: 'Citas para mañana', desc: manana + ' programadas' });
    }
    alerts.push({ kind: 'info', icon: 'fa-info-circle', title: 'Citas activas', desc: activas + ' entre pendientes y confirmadas' });

    DashboardModule.alerts = alerts;

    if (container) {
        container.innerHTML = alerts.map(dashAlertRow).join('');
    }
}

function buildNotificationsHtml() {
    const list = DashboardModule.alerts || [];
    if (list.length === 0) {
        return '<p class="text-sm text-gray-500 text-center py-4">Sin notificaciones por ahora.</p>';
    }
    return '<div class="text-left space-y-3">' + list.map(dashAlertRow).join('') + '</div>';
}

/**
 * Próximas citas reales (reemplaza actividad ficticia)
 */
function renderUpcoming() {
    const container = document.getElementById('upcomingList');
    if (!container) return;

    const t = todayKey(new Date());
    const proximas = DashboardModule.citas
        .filter(function (c) { return citaDateKey(c) >= t; })
        .sort(function (a, b) {
            const fa = citaDateKey(a) + horaCorta(a.hora);
            const fb = citaDateKey(b) + horaCorta(b.hora);
            return fa.localeCompare(fb);
        })
        .slice(0, 5);

    if (proximas.length === 0) {
        container.innerHTML =
            '<div class="text-center py-8 text-gray-500">' +
                '<i class="fas fa-calendar-alt text-3xl mb-3"></i>' +
                '<p>Sin próximas citas programadas</p>' +
            '</div>';
        return;
    }

    container.innerHTML = proximas.map(function (cita) {
        const tipo = (cita.tipoCita && cita.tipoCita.nombre) || 'Consulta General';
        return '' +
        '<div class="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">' +
            '<div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">' +
                '<i class="fas fa-calendar-day text-emerald-600"></i>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
                '<p class="text-sm font-medium text-gray-900 truncate">' + esc(nombrePaciente(cita.paciente)) + '</p>' +
                '<p class="text-xs text-gray-500 truncate">' + esc(tipo) + ' · ' + esc(nombreOdontologo(cita.odontologo)) + '</p>' +
            '</div>' +
            '<span class="text-xs text-gray-400 flex-shrink-0 ml-2">' + esc(fmtFechaCorta(citaDateKey(cita))) + ' · ' + esc(horaCorta(cita.hora)) + '</span>' +
        '</div>';
    }).join('');
}

/**
 * Inicializa las gráficas del dashboard (vacías; se llenan con datos reales)
 */
function initializeCharts() {
    console.log('📈 Inicializando gráficas...');
    initializeAppointmentsChart();
    initializeTreatmentsChart();
}

/**
 * Gráfica de citas por mes del año actual (datos reales)
 */
function initializeAppointmentsChart() {
    const ctx = document.getElementById('appointmentsChart');
    if (!ctx) return;

    DashboardModule.charts.appointments = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            datasets: [{
                label: 'Citas Programadas',
                data: new Array(12).fill(0),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#6b7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#10b981'
                }
            }
        }
    });
}

/**
 * Gráfica de tipos de cita más solicitados (datos reales)
 */
function initializeTreatmentsChart() {
    const ctx = document.getElementById('treatmentsChart');
    if (!ctx) return;

    DashboardModule.charts.treatments = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: DASH_CHART_COLORS,
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: '#6b7280'
                    }
                }
            }
        }
    });
}

function computeMonthlyCounts() {
    const counts = new Array(12).fill(0);
    const year = new Date().getFullYear();
    DashboardModule.citas.forEach(function (c) {
        const k = citaDateKey(c);
        if (k.length >= 10 && parseInt(k.slice(0, 4), 10) === year) {
            const m = parseInt(k.slice(5, 7), 10);
            if (m >= 1 && m <= 12) counts[m - 1]++;
        }
    });
    return counts;
}

function computeTypeGroups() {
    const map = {};
    DashboardModule.citas.forEach(function (c) {
        const n = (c.tipoCita && c.tipoCita.nombre) || 'Consulta General';
        map[n] = (map[n] || 0) + 1;
    });
    const entries = Object.entries(map).sort(function (a, b) { return b[1] - a[1]; });
    const top = entries.slice(0, 6);
    const rest = entries.slice(6).reduce(function (s, e) { return s + e[1]; }, 0);
    if (rest > 0) top.push(['Otros', rest]);
    return top;
}

/**
 * Actualiza la gráfica de citas con datos reales
 */
function updateAppointmentsChart() {
    if (!DashboardModule.charts.appointments) initializeAppointmentsChart();
    const chart = DashboardModule.charts.appointments;
    if (!chart) return;
    chart.data.datasets[0].data = computeMonthlyCounts();
    chart.update();
}

/**
 * Actualiza la gráfica de tratamientos con datos reales
 */
function updateTreatmentsChart() {
    if (!DashboardModule.charts.treatments) initializeTreatmentsChart();
    const chart = DashboardModule.charts.treatments;
    if (!chart) return;
    const groups = computeTypeGroups();
    if (groups.length === 0) {
        chart.data.labels = ['Sin registros'];
        chart.data.datasets[0].data = [1];
        chart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    } else {
        chart.data.labels = groups.map(function (g) { return g[0]; });
        chart.data.datasets[0].data = groups.map(function (g) { return g[1]; });
        const colors = DASH_CHART_COLORS.slice();
        while (colors.length < groups.length) colors.push('#9ca3af');
        chart.data.datasets[0].backgroundColor = colors.slice(0, groups.length);
    }
    chart.update();
}

/**
 * Carga los selects del modal de cita rápida con datos reales
 */
function fillQuickSelect(selectId, items, labelFn, placeholder) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = placeholder;
    sel.appendChild(ph);
    (items || []).forEach(function (it) {
        const op = document.createElement('option');
        op.value = it.id;
        op.textContent = labelFn(it);
        sel.appendChild(op);
    });
}

async function loadQuickSelects() {
    const results = await Promise.all([
        apiGet('/api/pacientes').catch(function () { return []; }),
        apiGet('/api/odontologos').catch(function () { return []; }),
        apiGet('/api/tipos-cita').catch(function () { return []; })
    ]);
    fillQuickSelect('qaPaciente', results[0], function (p) {
        return ((p.nombres || '') + ' ' + (p.apellidos || '')).trim() || ('Paciente ' + p.id);
    }, 'Seleccionar paciente...');
    fillQuickSelect('qaOdontologo', results[1], function (o) {
        return 'Dr. ' + (((o.nombre || '') + ' ' + (o.apellido || '')).trim() || ('#' + o.id));
    }, 'Seleccionar odontólogo...');
    fillQuickSelect('qaTipo', results[2], function (t) {
        return t.nombre || t.descripcion || ('Tipo ' + t.id);
    }, 'Seleccionar tipo...');
}

/**
 * Abre el modal de cita rápida con datos reales
 */
async function openQuickAppointmentModal() {
    const modal = document.getElementById('quickAppointmentModal');
    const form = document.getElementById('quickAppointmentForm');

    if (modal && form) {
        // Limpiar formulario
        form.reset();

        // Establecer fecha mínima y por defecto (hoy)
        const today = todayKey(new Date());
        const dateInput = document.getElementById('qaFecha');
        if (dateInput) {
            dateInput.min = today;
            dateInput.value = today;
        }

        // Cargar opciones reales antes de mostrar
        await loadQuickSelects();

        // Mostrar modal
        modal.classList.remove('hidden');

        // Focus en el primer campo
        setTimeout(() => {
            const firstSelect = form.querySelector('select');
            if (firstSelect) firstSelect.focus();
        }, 100);

        // Animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

/**
 * Cierra el modal de cita rápida
 */
function closeQuickAppointmentModal() {
    const modal = document.getElementById('quickAppointmentModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

/**
 * Crea la cita rápida con datos reales en el backend
 */
async function handleQuickAppointmentSubmit(e) {
    e.preventDefault();

    const pacienteId = document.getElementById('qaPaciente').value;
    const odontologoId = document.getElementById('qaOdontologo').value;
    const tipoId = document.getElementById('qaTipo').value;
    const fecha = document.getElementById('qaFecha').value;
    const hora = document.getElementById('qaHora').value;
    const motivo = document.getElementById('qaMotivo').value.trim();

    const missing = [];
    if (!pacienteId) missing.push('el paciente');
    if (!odontologoId) missing.push('el odontólogo');
    if (!tipoId) missing.push('el tipo de cita');
    if (!fecha) missing.push('la fecha');
    if (!hora) missing.push('la hora');

    if (missing.length > 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Datos incompletos',
            text: 'Debes seleccionar ' + missing.join(', ') + '.',
            confirmButtonColor: '#f59e0b'
        });
        return;
    }

    try {
        // Mostrar loading (guardado real)
        Swal.fire({
            title: 'Agendando cita rápida...',
            html: 'Por favor espere mientras procesamos la cita',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('/api/citas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paciente: { id: parseInt(pacienteId, 10) },
                odontologo: { id: parseInt(odontologoId, 10) },
                tipoCita: { id: parseInt(tipoId, 10) },
                fecha: fecha,
                hora: hora,
                duracion: 30,
                observaciones: motivo,
                estado: 'PENDIENTE'
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || ('HTTP ' + response.status));
        }

        // Cerrar modal
        closeQuickAppointmentModal();

        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Cita agendada exitosamente!',
            html: `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-calendar-check text-4xl text-emerald-500 mb-2"></i>
                    </div>
                    <p class="text-gray-600">La cita rápida ha sido programada exitosamente.</p>
                    <div class="mt-4 p-3 bg-emerald-50 rounded-lg">
                        <p class="text-sm text-emerald-700">
                            <i class="fas fa-info-circle mr-1"></i>
                            Se enviará una confirmación al paciente
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#10b981'
        });

        // Actualizar estadísticas
        refreshDashboard();

    } catch (error) {
        console.error('Error al crear cita rápida:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al agendar',
            text: 'No se pudo agendar la cita. Por favor intente nuevamente.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Refresca todos los datos del dashboard
 */
async function refreshDashboard() {
    if (DashboardModule.isUpdating) return;

    DashboardModule.isUpdating = true;

    try {
        console.log('🔄 Actualizando dashboard...');

        // Mostrar indicador de actualización
        const refreshButton = document.querySelector('button[onclick="refreshDashboard()"]');
        if (refreshButton) {
            const icon = refreshButton.querySelector('i');
            icon.classList.add('fa-spin');
        }

        // Recargar datos (las gráficas se actualizan dentro)
        await loadDashboardData();

        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Dashboard actualizado',
            text: 'Los datos han sido actualizados exitosamente.',
            timer: 1500,
            showConfirmButton: false,
            position: 'top-end',
            toast: true
        });

    } catch (error) {
        console.error('Error al actualizar dashboard:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error de actualización',
            text: 'No se pudieron actualizar los datos.',
            confirmButtonColor: '#dc2626'
        });
    } finally {
        DashboardModule.isUpdating = false;

        // Remover indicador de actualización
        const refreshButton = document.querySelector('button[onclick="refreshDashboard()"]');
        if (refreshButton) {
            const icon = refreshButton.querySelector('i');
            icon.classList.remove('fa-spin');
        }
    }
}

/**
 * Configura la actualización automática
 */
function setupAutoRefresh() {
    // Limpiar intervalo anterior si existe
    if (DashboardModule.updateInterval) {
        clearInterval(DashboardModule.updateInterval);
    }

    // Configurar nuevo intervalo
    DashboardModule.updateInterval = setInterval(() => {
        if (!document.hidden && !DashboardModule.isUpdating) {
            refreshDashboard();
        }
    }, DashboardModule.refreshRate);

    console.log(`⏰ Auto-refresh configurado cada ${DashboardModule.refreshRate / 1000} segundos`);
}

/**
 * Ver todas las citas (navega al módulo real)
 */
function viewAllAppointments() {
    window.location.href = '/citas';
}

/**
 * Abrir vista de calendario (navega al módulo real)
 */
function openCalendarView() {
    window.location.href = '/citas';
}

/**
 * Ver detalles de una cita real de la agenda
 */
function viewAppointmentQuick(appointmentId) {
    const cita = (DashboardModule.citas || []).find(function (c) {
        return String(c.id) === String(appointmentId);
    });

    if (!cita) {
        Swal.fire({
            icon: 'error',
            title: 'No disponible',
            text: 'La cita ya no está en la agenda cargada. Actualiza el dashboard.',
            confirmButtonColor: '#dc2626'
        });
        return;
    }

    const meta = estadoMeta(cita.estado);
    const tipo = (cita.tipoCita && cita.tipoCita.nombre) || 'Consulta General';

    Swal.fire({
        title: 'Detalles de la Cita',
        html: `
            <div class="text-left">
                <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-2">${esc(nombrePaciente(cita.paciente))}</h4>
                    <p class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-calendar mr-2 text-emerald-500"></i>
                        ${esc(fmtFechaCorta(citaDateKey(cita)))} a las ${esc(horaCorta(cita.hora))}
                    </p>
                    <p class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-user-md mr-2 text-blue-500"></i>
                        ${esc(nombreOdontologo(cita.odontologo))}
                    </p>
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-tooth mr-2 text-purple-500"></i>
                        ${esc(tipo)}
                    </p>
                </div>
                <div class="flex justify-center">
                    <span class="px-3 py-1 text-sm font-medium rounded-full ${meta.badge}">
                        ${meta.text}
                    </span>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Ver en módulo',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/citas';
        }
    });
}

/**
 * Ver próximas citas (navega al módulo real)
 */
function viewAllActivity() {
    window.location.href = '/citas';
}

/**
 * Actualiza la fecha actual
 */
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const today = new Date();
        dateElement.textContent = today.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

/**
 * Actualiza la gráfica de citas con datos reales
 */
function updateAppointmentsChart() {
    if (!DashboardModule.charts.appointments) initializeAppointmentsChart();
    const chart = DashboardModule.charts.appointments;
    if (!chart) return;
    chart.data.datasets[0].data = computeMonthlyCounts();
    chart.update();
}

/**
 * Actualiza la gráfica de tratamientos con datos reales
 */
function updateTreatmentsChart() {
    if (!DashboardModule.charts.treatments) initializeTreatmentsChart();
    const chart = DashboardModule.charts.treatments;
    if (!chart) return;
    const groups = computeTypeGroups();
    if (groups.length === 0) {
        chart.data.labels = ['Sin registros'];
        chart.data.datasets[0].data = [1];
        chart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    } else {
        chart.data.labels = groups.map(function (g) { return g[0]; });
        chart.data.datasets[0].data = groups.map(function (g) { return g[1]; });
        const colors = DASH_CHART_COLORS.slice();
        while (colors.length < groups.length) colors.push('#9ca3af');
        chart.data.datasets[0].backgroundColor = colors.slice(0, groups.length);
    }
    chart.update();
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
    console.log('🏠 Bienvenido al Dashboard de Clínica Odontológica');
}

// Limpiar recursos al salir de la página
window.addEventListener('beforeunload', function() {
    if (DashboardModule.updateInterval) {
        clearInterval(DashboardModule.updateInterval);
    }

    // Destruir gráficas
    Object.values(DashboardModule.charts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
});

// Exportar funciones principales para uso global
window.DashboardModule = DashboardModule;
window.openQuickAppointmentModal = openQuickAppointmentModal;
window.closeQuickAppointmentModal = closeQuickAppointmentModal;
window.refreshDashboard = refreshDashboard;
window.viewAllAppointments = viewAllAppointments;
window.openCalendarView = openCalendarView;
window.viewAppointmentQuick = viewAppointmentQuick;
window.viewAllActivity = viewAllActivity;
window.buildNotificationsHtml = buildNotificationsHtml;

/* Cierre de modales de acción con clic fuera o tecla Escape */
(function () {
    var ACTION_MODALS = [
        { id: 'quickAppointmentModal', close: closeQuickAppointmentModal }
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
