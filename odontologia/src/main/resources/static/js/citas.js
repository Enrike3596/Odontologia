/**
 * Sistema de Gestión de Citas Médicas - Clínica Odontológica
 * Funcionalidades CRUD para citas con validaciones médicas y SweetAlert2
 */

// Estado global del módulo de citas
const AppointmentsModule = {
    currentAppointment: null,
    filters: {
        search: '',
        estado: '',
        odontologo: '',
        fecha: ''
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0
    },
    appointmentStatuses: [
        { id: 'pendiente', name: 'Pendiente', color: 'yellow' },
        { id: 'confirmada', name: 'Confirmada', color: 'green' },
        { id: 'completada', name: 'Completada', color: 'blue' },
        { id: 'cancelada', name: 'Cancelada', color: 'red' },
        { id: 'no-asistio', name: 'No Asistió', color: 'gray' }
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
    currentDate: new Date()
};

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
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
}

/**
 * Abre el modal para crear una nueva cita
 */
function openNewAppointmentModal() {
    const modal = document.getElementById('newAppointmentModal');
    const form = document.getElementById('newAppointmentForm');
    
    if (modal && form) {
        // Limpiar formulario
        form.reset();
        
        // Establecer fecha mínima (hoy)
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('fechaCita').min = today;
        
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
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Programando cita...',
            html: 'Por favor espere mientras procesamos la información de la cita médica',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Simular llamada a la API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular respuesta exitosa
        const newAppointment = {
            id: Date.now(),
            ...appointmentData,
            fechaCreacion: new Date().toISOString(),
            pacienteNombre: getPatientName(appointmentData.pacienteId),
            odontologoNombre: getDoctorName(appointmentData.odontologoId)
        };
        
        // Cerrar modal
        closeNewAppointmentModal();
        
        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Cita programada exitosamente!',
            html: `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-calendar-check text-4xl text-emerald-500 mb-2"></i>
                    </div>
                    <p class="text-gray-600">La cita para <strong>${newAppointment.pacienteNombre}</strong> ha sido programada.</p>
                    <div class="mt-4 p-3 bg-emerald-50 rounded-lg">
                        <p class="text-sm text-emerald-700">
                            <i class="fas fa-calendar mr-1"></i>
                            ${formatDate(appointmentData.fechaCita)} a las ${appointmentData.horaCita}
                        </p>
                        <p class="text-sm text-emerald-700">
                            <i class="fas fa-user-md mr-1"></i>
                            ${newAppointment.odontologoNombre}
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#10b981'
        });
        
        // Recargar lista
        loadAppointments();
        updateTodayTimeline();
        
    } catch (error) {
        console.error('Error al crear cita:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error al programar cita',
            text: 'No se pudo programar la cita médica. Por favor intente nuevamente.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Valida los datos de la cita médica
 */
function validateAppointmentData(data) {
    const errors = [];
    
    // Validaciones requeridas
    if (!data.pacienteId) errors.push('Debe seleccionar un paciente');
    if (!data.tipoCita) errors.push('Debe seleccionar el tipo de cita');
    if (!data.fechaCita) errors.push('Debe seleccionar una fecha');
    if (!data.horaCita) errors.push('Debe seleccionar una hora');
    if (!data.odontologoId) errors.push('Debe asignar un odontólogo');
    
    // Validación de fecha
    if (data.fechaCita) {
        const selectedDate = new Date(data.fechaCita);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
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
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Cargando detalles de la cita...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Datos simulados de la cita
        const appointment = getSimulatedAppointment(appointmentId);
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar modal de detalles
        showAppointmentDetailsModal(appointment);
        
    } catch (error) {
        console.error('Error al cargar cita:', error);
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
    document.getElementById('viewAppointmentTitle').textContent = `Cita - ${appointment.fechaCita} ${appointment.horaCita}`;
    document.getElementById('viewAppointmentPatient').textContent = appointment.pacienteNombre;
    document.getElementById('viewAppointmentType').textContent = appointment.tipoNombre;
    document.getElementById('viewAppointmentDateTime').textContent = `${formatDate(appointment.fechaCita)} a las ${appointment.horaCita}`;
    
    // Llenar detalles
    document.getElementById('viewPatientDocument').textContent = appointment.pacienteDocumento || 'No especificado';
    document.getElementById('viewPatientPhone').textContent = appointment.pacienteTelefono || 'No especificado';
    document.getElementById('viewAppointmentDuration').textContent = `${appointment.duracion} minutos`;
    document.getElementById('viewAppointmentOffice').textContent = appointment.consultorio || 'Por asignar';
    document.getElementById('viewAppointmentDoctor').textContent = appointment.odontologoNombre;
    document.getElementById('viewDoctorSpecialty').textContent = appointment.odontologoEspecialidad || 'Odontología General';
    document.getElementById('viewAppointmentReason').textContent = appointment.motivoConsulta || 'No especificado';
    
    // Estado
    const statusElement = document.getElementById('viewAppointmentStatus');
    const status = AppointmentsModule.appointmentStatuses.find(s => s.id === appointment.estado);
    if (status) {
        statusElement.textContent = status.name;
        statusElement.className = `px-2 py-1 text-xs font-medium rounded-full bg-${status.color}-100 text-${status.color}-800`;
    }
    
    // Actualizar avatar
    const avatar = document.getElementById('viewAppointmentAvatar');
    avatar.innerHTML = getPatientInitials(appointment.pacienteNombre);
    
    // Guardar referencia de la cita actual
    AppointmentsModule.currentAppointment = appointment;
    
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
function editAppointment(appointmentId) {
    console.log('Editar cita:', appointmentId);
    
    Swal.fire({
        icon: 'info',
        title: 'Función en desarrollo',
        text: 'La edición de citas estará disponible próximamente.',
        confirmButtonColor: '#3b82f6'
    });
}

/**
 * Editar cita desde el modal de detalles
 */
function editAppointmentFromModal() {
    if (AppointmentsModule.currentAppointment) {
        closeViewAppointmentModal();
        editAppointment(AppointmentsModule.currentAppointment.id);
    }
}

/**
 * Confirmar cita
 */
async function confirmAppointment(appointmentId) {
    // Obtener datos de la cita
    const appointment = getSimulatedAppointment(appointmentId);
    
    const result = await Swal.fire({
        icon: 'question',
        title: '¿Confirmar cita médica?',
        html: `
            <div class="text-center">
                <div class="mb-4">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-check-circle text-green-600 text-xl"></i>
                    </div>
                    <p class="text-gray-700 mb-2">Paciente: <strong>${appointment.pacienteNombre}</strong></p>
                    <p class="text-sm text-gray-500">${formatDate(appointment.fechaCita)} a las ${appointment.horaCita}</p>
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
            
            // Simular confirmación
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Confirmar éxito
            await Swal.fire({
                icon: 'success',
                title: 'Cita confirmada',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">La cita de <strong>${appointment.pacienteNombre}</strong> ha sido confirmada exitosamente.</p>
                        <div class="mt-4 p-3 bg-green-50 rounded-lg">
                            <p class="text-sm text-green-700">
                                <i class="fas fa-bell mr-1"></i>
                                Se ha enviado una notificación al paciente
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#10b981'
            });
            
            // Recargar lista
            loadAppointments();
            updateTodayTimeline();
            
        } catch (error) {
            console.error('Error al confirmar cita:', error);
            
            Swal.fire({
                icon: 'error',
                title: 'Error al confirmar',
                text: 'No se pudo confirmar la cita.',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/**
 * Cancelar cita
 */
async function cancelAppointment(appointmentId) {
    // Obtener datos de la cita
    const appointment = getSimulatedAppointment(appointmentId);
    
    const { value: reason } = await Swal.fire({
        icon: 'warning',
        title: '¿Cancelar cita médica?',
        html: `
            <div class="text-center mb-4">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-times-circle text-red-600 text-xl"></i>
                </div>
                <p class="text-gray-700 mb-2">Paciente: <strong>${appointment.pacienteNombre}</strong></p>
                <p class="text-sm text-gray-500">${formatDate(appointment.fechaCita)} a las ${appointment.horaCita}</p>
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
            
            // Simular cancelación
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Confirmar cancelación
            await Swal.fire({
                icon: 'success',
                title: 'Cita cancelada',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">La cita de <strong>${appointment.pacienteNombre}</strong> ha sido cancelada.</p>
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
            loadAppointments();
            updateTodayTimeline();
            
        } catch (error) {
            console.error('Error al cancelar cita:', error);
            
            Swal.fire({
                icon: 'error',
                title: 'Error al cancelar',
                text: 'No se pudo cancelar la cita.',
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
 * Imprimir cita
 */
function printAppointment() {
    if (AppointmentsModule.currentAppointment) {
        Swal.fire({
            icon: 'info',
            title: 'Imprimiendo cita...',
            html: `
                <div class="text-center">
                    <i class="fas fa-print text-4xl text-gray-500 mb-3"></i>
                    <p class="text-gray-600">Generando comprobante de cita para imprimir.</p>
                </div>
            `,
            timer: 2000,
            confirmButtonColor: '#6b7280'
        });
    }
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
function updateTodayTimeline() {
    console.log('📅 Actualizando timeline del día:', AppointmentsModule.currentDate);
    // Aquí se cargarían las citas del día seleccionado
}

/**
 * Carga la lista de citas
 */
async function loadAppointments() {
    try {
        console.log('📅 Cargando citas...');
        
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ Citas cargadas exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar citas:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo cargar la lista de citas.',
            confirmButtonColor: '#dc2626'
        });
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
        
        // Simular filtrado
        Swal.fire({
            icon: 'success',
            title: 'Filtros aplicados',
            text: 'La lista de citas ha sido filtrada según los criterios seleccionados.',
            timer: 1500,
            showConfirmButton: false
        });
        
        loadAppointments();
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
        
        loadAppointments();
    }
}

/**
 * Maneja la búsqueda en tiempo real
 */
function handleSearchInput(e) {
    const query = e.target.value.trim();
    console.log('🔍 Búsqueda en tiempo real:', query);
    
    AppointmentsModule.filters.search = query;
    loadAppointments();
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
 * Obtener nombre del paciente por ID
 */
function getPatientName(patientId) {
    const patients = {
        '1': 'María González Pérez',
        '2': 'Carlos Ramírez López',
        '3': 'Ana Sofía Herrera',
        '4': 'Juan Pablo Mendoza'
    };
    return patients[patientId] || 'Paciente no encontrado';
}

/**
 * Obtener nombre del odontólogo por ID
 */
function getDoctorName(doctorId) {
    const doctors = {
        '1': 'Dr. Roberto Martínez',
        '2': 'Dra. María López',
        '3': 'Dr. Luis García',
        '4': 'Dra. Carmen Silva'
    };
    return doctors[doctorId] || 'Odontólogo no asignado';
}

/**
 * Obtener iniciales del paciente para el avatar
 */
function getPatientInitials(nombre) {
    if (!nombre) return '<span class="text-emerald-600 font-bold text-xl">CT</span>';
    
    const parts = nombre.split(' ');
    const firstInitial = parts[0]?.charAt(0)?.toUpperCase() || '';
    const lastInitial = parts[1]?.charAt(0)?.toUpperCase() || '';
    return `<span class="text-emerald-600 font-bold text-xl">${firstInitial}${lastInitial}</span>`;
}

/**
 * Obtener datos simulados de una cita
 */
function getSimulatedAppointment(appointmentId) {
    const appointments = {
        1: {
            id: 1,
            pacienteId: 1,
            pacienteNombre: 'María González Pérez',
            pacienteDocumento: 'CC: 1234567890',
            pacienteTelefono: '(321) 555-0123',
            fechaCita: '2024-11-04',
            horaCita: '08:00',
            duracion: 60,
            tipoCita: 'limpieza',
            tipoNombre: 'Limpieza dental',
            odontologoId: 1,
            odontologoNombre: 'Dr. Roberto Martínez',
            odontologoEspecialidad: 'Odontología General',
            consultorio: 'Consultorio 1',
            motivoConsulta: 'Limpieza dental y revisión general',
            estado: 'confirmada',
            prioridad: 'normal'
        },
        2: {
            id: 2,
            pacienteId: 2,
            pacienteNombre: 'Carlos Ramírez López',
            pacienteDocumento: 'CC: 9876543210',
            pacienteTelefono: '(314) 555-0456',
            fechaCita: '2024-11-04',
            horaCita: '10:30',
            duracion: 90,
            tipoCita: 'endodoncia',
            tipoNombre: 'Tratamiento de conducto',
            odontologoId: 2,
            odontologoNombre: 'Dra. María López',
            odontologoEspecialidad: 'Endodoncia',
            consultorio: 'Consultorio 2',
            motivoConsulta: 'Tratamiento de conducto - Sesión 2',
            estado: 'pendiente',
            prioridad: 'alta'
        },
        3: {
            id: 3,
            pacienteId: 3,
            pacienteNombre: 'Ana Sofía Herrera',
            pacienteDocumento: 'CC: 5555666677',
            pacienteTelefono: '(300) 555-0789',
            fechaCita: '2024-11-04',
            horaCita: '14:00',
            duracion: 60,
            tipoCita: 'ortodoncia',
            tipoNombre: 'Consulta de ortodoncia',
            odontologoId: 3,
            odontologoNombre: 'Dr. Luis García',
            odontologoEspecialidad: 'Ortodoncia',
            consultorio: 'Consultorio 3',
            motivoConsulta: 'Consulta de ortodoncia - Evaluación inicial',
            estado: 'confirmada',
            prioridad: 'normal'
        }
    };
    
    return appointments[appointmentId] || appointments[1];
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

// Exportar funciones principales para uso global
window.AppointmentsModule = AppointmentsModule;
window.openNewAppointmentModal = openNewAppointmentModal;
window.closeNewAppointmentModal = closeNewAppointmentModal;
window.viewAppointment = viewAppointment;
window.closeViewAppointmentModal = closeViewAppointmentModal;
window.editAppointment = editAppointment;
window.editAppointmentFromModal = editAppointmentFromModal;
window.confirmAppointment = confirmAppointment;
window.cancelAppointment = cancelAppointment;
window.openCalendarView = openCalendarView;
window.printAppointment = printAppointment;
window.goToPreviousDay = goToPreviousDay;
window.goToNextDay = goToNextDay;
window.goToToday = goToToday;
window.toggleFilters = toggleFilters;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;