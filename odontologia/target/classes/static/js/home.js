/**
 * Sistema Dashboard - Clínica Odontológica
 * Panel principal con estadísticas, gráficas y resumen de actividades
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
    currentStats: {
        todayAppointments: 0,
        activePatients: 0,
        monthlyRevenue: 0,
        availableDoctors: 0
    }
};

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
    
    // Cargar datos iniciales
    loadDashboardData();
    
    // Inicializar gráficas
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

/**
 * Carga los datos del dashboard
 */
async function loadDashboardData() {
    try {
        console.log('📊 Cargando datos del dashboard...');
        
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simular datos del dashboard
        const dashboardData = await getDashboardStats();
        
        // Actualizar estadísticas
        updateStatistics(dashboardData);
        
        // Cargar actividad reciente
        loadRecentActivity();
        
        console.log('✅ Datos del dashboard cargados exitosamente');
        
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
 * Actualiza las estadísticas principales
 */
function updateStatistics(data) {
    // Animar contadores
    animateCounter('todayAppointments', DashboardModule.currentStats.todayAppointments, data.todayAppointments);
    animateCounter('activePatients', DashboardModule.currentStats.activePatients, data.activePatients);
    animateCounter('availableDoctors', DashboardModule.currentStats.availableDoctors, data.availableDoctors);
    
    // Actualizar ingresos con formato de moneda
    animateRevenue('monthlyRevenue', DashboardModule.currentStats.monthlyRevenue, data.monthlyRevenue);
    
    // Guardar estadísticas actuales
    DashboardModule.currentStats = data;
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
 * Anima el contador de ingresos con formato de moneda
 */
function animateRevenue(elementId, startValue, endValue, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startTime = Date.now();
    const valueRange = endValue - startValue;
    
    const updateRevenue = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (valueRange * easeOutQuart));
        
        element.textContent = `$${currentValue.toLocaleString()}`;
        
        if (progress < 1) {
            requestAnimationFrame(updateRevenue);
        }
    };
    
    requestAnimationFrame(updateRevenue);
}

/**
 * Inicializa las gráficas del dashboard
 */
function initializeCharts() {
    console.log('📈 Inicializando gráficas...');
    
    // Gráfica de citas por mes
    initializeAppointmentsChart();
    
    // Gráfica de tratamientos
    initializeTreatmentsChart();
}

/**
 * Inicializa la gráfica de citas por mes
 */
function initializeAppointmentsChart() {
    const ctx = document.getElementById('appointmentsChart');
    if (!ctx) return;
    
    DashboardModule.charts.appointments = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'],
            datasets: [{
                label: 'Citas Programadas',
                data: [320, 289, 389, 421, 387, 445, 492, 518, 456, 489, 524],
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
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#6b7280'
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
 * Inicializa la gráfica de tratamientos más solicitados
 */
function initializeTreatmentsChart() {
    const ctx = document.getElementById('treatmentsChart');
    if (!ctx) return;
    
    DashboardModule.charts.treatments = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Limpieza Dental', 'Endodoncia', 'Ortodoncia', 'Cirugía Oral', 'Estética', 'Periodoncia'],
            datasets: [{
                data: [35, 20, 18, 12, 10, 5],
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#8b5cf6',
                    '#f59e0b',
                    '#ef4444',
                    '#06b6d4'
                ],
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

/**
 * Abre el modal de cita rápida
 */
function openQuickAppointmentModal() {
    const modal = document.getElementById('quickAppointmentModal');
    const form = document.getElementById('quickAppointmentForm');
    
    if (modal && form) {
        // Limpiar formulario
        form.reset();
        
        // Establecer fecha mínima (hoy)
        const today = new Date().toISOString().split('T')[0];
        const dateInput = form.querySelector('input[type="date"]');
        if (dateInput) {
            dateInput.min = today;
            dateInput.value = today; // Establecer fecha por defecto
        }
        
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
 * Maneja el envío del formulario de cita rápida
 */
async function handleQuickAppointmentSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const appointmentData = Object.fromEntries(formData);
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Agendando cita rápida...',
            html: 'Por favor espere mientras procesamos la cita',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Simular llamada a la API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
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
        
        // Recargar datos
        await loadDashboardData();
        
        // Actualizar gráficas si existen
        if (DashboardModule.charts.appointments) {
            updateAppointmentsChart();
        }
        
        if (DashboardModule.charts.treatments) {
            updateTreatmentsChart();
        }
        
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
 * Ver todas las citas
 */
function viewAllAppointments() {
    Swal.fire({
        icon: 'info',
        title: 'Redirigiendo a Citas',
        html: `
            <div class="text-center">
                <i class="fas fa-calendar-alt text-4xl text-emerald-500 mb-3"></i>
                <p class="text-gray-600">Redirigiendo al módulo de gestión de citas médicas.</p>
            </div>
        `,
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        // Aquí se redirigiría al módulo de citas
        window.location.href = '/citas';
    });
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
                <i class="fas fa-calendar text-4xl text-blue-500 mb-3"></i>
                <p class="text-gray-600">Abriendo vista de calendario completa.</p>
            </div>
        `,
        timer: 1500,
        showConfirmButton: false
    });
}

/**
 * Ver detalles rápidos de una cita
 */
function viewAppointmentQuick(appointmentId) {
    const appointment = getSimulatedAppointment(appointmentId);
    
    Swal.fire({
        title: 'Detalles de la Cita',
        html: `
            <div class="text-left">
                <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-2">${appointment.pacienteNombre}</h4>
                    <p class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-calendar mr-2 text-emerald-500"></i>
                        ${appointment.fecha} a las ${appointment.hora}
                    </p>
                    <p class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-user-md mr-2 text-blue-500"></i>
                        ${appointment.odontologo}
                    </p>
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-tooth mr-2 text-purple-500"></i>
                        ${appointment.tratamiento}
                    </p>
                </div>
                <div class="flex justify-center">
                    <span class="px-3 py-1 text-sm font-medium rounded-full ${appointment.statusClass}">
                        ${appointment.status}
                    </span>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Ver detalles completos',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280'
    }).then((result) => {
        if (result.isConfirmed) {
            // Redirigir a la vista completa de la cita
            viewAllAppointments();
        }
    });
}

/**
 * Ver toda la actividad
 */
function viewAllActivity() {
    Swal.fire({
        icon: 'info',
        title: 'Historial de Actividad',
        html: `
            <div class="text-center">
                <i class="fas fa-history text-4xl text-gray-500 mb-3"></i>
                <p class="text-gray-600">Mostrando historial completo de actividades del sistema.</p>
            </div>
        `,
        timer: 1500,
        showConfirmButton: false
    });
}

/**
 * Carga la actividad reciente
 */
function loadRecentActivity() {
    console.log('📋 Cargando actividad reciente...');
    // Los datos ya están en el HTML, aquí se podrían cargar dinámicamente
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
 * Actualiza la gráfica de citas
 */
function updateAppointmentsChart() {
    if (DashboardModule.charts.appointments) {
        // Simular nuevos datos
        const newData = [325, 294, 394, 426, 392, 450, 497, 523, 461, 494, 529];
        DashboardModule.charts.appointments.data.datasets[0].data = newData;
        DashboardModule.charts.appointments.update('active');
    }
}

/**
 * Actualiza la gráfica de tratamientos
 */
function updateTreatmentsChart() {
    if (DashboardModule.charts.treatments) {
        // Simular nuevos datos
        const newData = [37, 22, 16, 13, 8, 4];
        DashboardModule.charts.treatments.data.datasets[0].data = newData;
        DashboardModule.charts.treatments.update('active');
    }
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

// ===============================
// FUNCIONES UTILITARIAS
// ===============================

/**
 * Obtiene estadísticas simuladas del dashboard
 */
async function getDashboardStats() {
    // Simular datos en tiempo real
    return {
        todayAppointments: Math.floor(Math.random() * 5) + 22, // 22-26
        activePatients: Math.floor(Math.random() * 20) + 1240, // 1240-1259
        monthlyRevenue: Math.floor(Math.random() * 5000) + 43000, // 43000-47999
        availableDoctors: Math.floor(Math.random() * 3) + 6 // 6-8
    };
}

/**
 * Obtiene datos simulados de una cita
 */
function getSimulatedAppointment(appointmentId) {
    const appointments = {
        1: {
            pacienteNombre: 'María González Pérez',
            fecha: '04 Nov 2024',
            hora: '08:00 AM',
            odontologo: 'Dr. Roberto Martínez',
            tratamiento: 'Limpieza dental',
            status: 'Confirmada',
            statusClass: 'bg-green-100 text-green-800'
        },
        2: {
            pacienteNombre: 'Carlos Ramírez López',
            fecha: '04 Nov 2024',
            hora: '10:30 AM',
            odontologo: 'Dra. María López',
            tratamiento: 'Endodoncia',
            status: 'Pendiente',
            statusClass: 'bg-yellow-100 text-yellow-800'
        },
        3: {
            pacienteNombre: 'Ana Sofía Herrera',
            fecha: '04 Nov 2024',
            hora: '14:00 PM',
            odontologo: 'Dr. Luis García',
            tratamiento: 'Ortodoncia',
            status: 'Confirmada',
            statusClass: 'bg-green-100 text-green-800'
        }
    };
    
    return appointments[appointmentId] || appointments[1];
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