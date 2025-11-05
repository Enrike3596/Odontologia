/**
 * Sistema de Gestión de Citas Médicas - Clínica Odontológica
 * Funcionalidades CRUD para citas con validaciones médicas y SweetAlert2
 */

// Estado global del módulo de citas
const AppointmentsModule = {
    currentAppointment: null,
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
        itemsPerPage: 10,
        totalItems: 0
    },
    appointmentStatuses: [
        { id: 'PENDIENTE', name: 'Pendiente', color: 'yellow' },
        { id: 'CONFIRMADA', name: 'Confirmada', color: 'green' },
        { id: 'COMPLETADA', name: 'Completada', color: 'blue' },
        { id: 'CANCELADA', name: 'Cancelada', color: 'red' },
        { id: 'NO_ASISTIO', name: 'No Asistió', color: 'gray' }
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
            const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas/${id}`);
            if (!response.ok) throw new Error('Error al cargar la cita');
            return await response.json();
        } catch (error) {
            console.error('Error en getCitaById:', error);
            throw error;
        }
    },

    // Crear nueva cita
    async createCita(citaData) {
        try {
            const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(citaData)
            });
            if (!response.ok) throw new Error('Error al crear la cita');
            return await response.json();
        } catch (error) {
            console.error('Error en createCita:', error);
            throw error;
        }
    },

    // Actualizar cita
    async updateCita(id, citaData) {
        try {
            const response = await fetch(`${AppointmentsModule.apiBaseUrl}/citas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(citaData)
            });
            if (!response.ok) throw new Error('Error al actualizar la cita');
            return await response.json();
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
            if (!response.ok) throw new Error('Error al eliminar la cita');
            return true;
        } catch (error) {
            console.error('Error en deleteCita:', error);
            throw error;
        }
    }
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
async function openNewAppointmentModal(editData = null) {
    const modal = document.getElementById('newAppointmentModal');
    const form = document.getElementById('newAppointmentForm');
    
    if (modal && form) {
        // Limpiar formulario
        form.reset();
        
        // Configurar modo (crear o editar)
        const isEditMode = editData !== null;
        AppointmentsModule.editMode = isEditMode;
        AppointmentsModule.editingAppointmentId = isEditMode ? editData.id : null;
        
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
        
        // Si es modo edición, cargar datos
        if (isEditMode) {
            try {
                // Cargar selects primero
                await Promise.all([
                    loadPacientesSelect(),
                    loadOdontologosSelect(),
                    loadTiposCitaSelect()
                ]);
                
                // Llenar formulario con datos de la cita
                document.getElementById('pacienteId').value = editData.paciente.id;
                document.getElementById('odontologoId').value = editData.odontologo.id;
                document.getElementById('tipoCitaId').value = editData.tipoCita.id;
                document.getElementById('fechaCita').value = editData.fecha;
                document.getElementById('horaCita').value = editData.hora;
                document.getElementById('observaciones').value = editData.observaciones || '';
                
            } catch (error) {
                console.error('Error al cargar datos para edición:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos para editar la cita.',
                    confirmButtonColor: '#dc2626'
                });
                return;
            }
        } else {
            // Cargar selects para nueva cita
            await Promise.all([
                loadPacientesSelect(),
                loadOdontologosSelect(),
                loadTiposCitaSelect()
            ]);
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
        // Preparar datos para la API
        const citaData = {
            pacienteId: appointmentData.pacienteId,
            odontologoId: appointmentData.odontologoId,
            tipoCitaId: appointmentData.tipoCitaId,
            fecha: appointmentData.fechaCita,
            hora: appointmentData.horaCita,
            observaciones: appointmentData.observaciones || '',
            estado: 'PENDIENTE'
        };
        
        // Determinar si es creación o edición
        const isEdit = AppointmentsModule.editMode;
        const actionText = isEdit ? 'Actualizando' : 'Programando';
        const successText = isEdit ? 'actualizada' : 'programada';
        
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
            // Actualizar cita existente
            result = await CitasAPI.updateCita(AppointmentsModule.editingAppointmentId, citaData);
        } else {
            // Crear nueva cita
            result = await CitasAPI.createCita(citaData);
        }
        
        // Cerrar modal
        closeNewAppointmentModal();
        
        // Resetear modo de edición
        AppointmentsModule.editMode = false;
        AppointmentsModule.editingAppointmentId = null;
        
        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: `¡Cita ${successText} exitosamente!`,
            html: `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-calendar-check text-4xl text-emerald-500 mb-2"></i>
                    </div>
                    <p class="text-gray-600">La cita para <strong>${result.paciente.nombre} ${result.paciente.apellido}</strong> ha sido ${successText}.</p>
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
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#10b981'
        });
        
        // Recargar lista
        await loadAppointments();
        
    } catch (error) {
        console.error('Error al procesar cita:', error);
        
        const actionText = AppointmentsModule.editMode ? 'actualizar' : 'programar';
        
        Swal.fire({
            icon: 'error',
            title: `Error al ${actionText} cita`,
            text: `No se pudo ${actionText} la cita médica. Por favor intente nuevamente.`,
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
    document.getElementById('viewAppointmentPatient').textContent = `${appointment.paciente.nombre} ${appointment.paciente.apellido}`;
    document.getElementById('viewAppointmentType').textContent = appointment.tipoCita.nombre;
    document.getElementById('viewAppointmentDateTime').textContent = `${formatDate(appointment.fecha)} a las ${appointment.hora}`;
    
    // Llenar detalles
    document.getElementById('viewPatientDocument').textContent = appointment.paciente.cedula || 'No especificado';
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
    avatar.innerHTML = getPatientInitials(`${appointment.paciente.nombre} ${appointment.paciente.apellido}`);
    
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
async function editAppointment(appointmentId) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Cargando datos de la cita...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Obtener datos de la cita
        const appointment = await CitasAPI.getCitaById(appointmentId);
        
        // Cerrar loading
        Swal.close();
        
        // Abrir modal de nueva cita en modo edición
        await openNewAppointmentModal(appointment);
        
    } catch (error) {
        console.error('Error al cargar cita para edición:', error);
        Swal.close();
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información de la cita para editar.',
            confirmButtonColor: '#dc2626'
        });
    }
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
        console.log('📅 Cargando citas desde el servidor...');
        
        // Cargar citas usando la API
        const citas = await CitasAPI.getAllCitas();
        
        console.log('✅ Citas cargadas exitosamente:', citas.length, 'citas encontradas');
        
        // Actualizar la tabla de citas
        updateAppointmentsTable(citas);
        
        // Actualizar estadísticas
        updateAppointmentStats(citas);
        
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

/**
 * Actualiza la tabla de citas con los datos del servidor
 */
function updateAppointmentsTable(citas) {
    const tableBody = document.querySelector('#citasTable tbody');
    if (!tableBody) return;

    if (citas.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-3 text-gray-300"></i>
                    <p>No se encontraron citas</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = citas.map(cita => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <i class="fas fa-user-injured text-blue-600"></i>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                            ${cita.paciente.nombre} ${cita.paciente.apellido}
                        </div>
                        <div class="text-sm text-gray-500">${cita.paciente.email || ''}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatDate(cita.fecha)}</div>
                <div class="text-sm text-gray-500">${cita.hora}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${cita.odontologo.nombre} ${cita.odontologo.apellido}</div>
                <div class="text-sm text-gray-500">Dr. ${cita.odontologo.matricula}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">${cita.tipoCita.nombre}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(cita.estado)}">
                    ${getStatusText(cita.estado)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${cita.observaciones || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewAppointment(${cita.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editAppointment(${cita.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteAppointment(${cita.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Actualiza las estadísticas de citas
 */
function updateAppointmentStats(citas) {
    const today = new Date().toISOString().split('T')[0];
    
    // Citas de hoy
    const todayAppointments = citas.filter(cita => cita.fecha === today);
    const todayElement = document.getElementById('todayAppointments');
    if (todayElement) todayElement.textContent = todayAppointments.length;
    
    // Citas pendientes
    const pendingAppointments = citas.filter(cita => cita.estado === 'PENDIENTE');
    const pendingElement = document.getElementById('pendingAppointments');
    if (pendingElement) pendingElement.textContent = pendingAppointments.length;
    
    // Citas completadas (del mes actual)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const completedAppointments = citas.filter(cita => {
        const citaDate = new Date(cita.fecha);
        return cita.estado === 'COMPLETADA' && 
               citaDate.getMonth() === currentMonth && 
               citaDate.getFullYear() === currentYear;
    });
    const completedElement = document.getElementById('completedAppointments');
    if (completedElement) completedElement.textContent = completedAppointments.length;
}

/**
 * Obtiene el color del estado de la cita
 */
function getStatusColor(estado) {
    const colors = {
        'PENDIENTE': 'bg-yellow-100 text-yellow-800',
        'CONFIRMADA': 'bg-green-100 text-green-800',
        'COMPLETADA': 'bg-blue-100 text-blue-800',
        'CANCELADA': 'bg-red-100 text-red-800',
        'NO_ASISTIO': 'bg-gray-100 text-gray-800'
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
        'COMPLETADA': 'Completada',
        'CANCELADA': 'Cancelada',
        'NO_ASISTIO': 'No Asistió'
    };
    return texts[estado] || estado;
}

/**
 * Elimina una cita
 */
async function deleteAppointment(citaId) {
    const result = await Swal.fire({
        title: '¿Eliminar cita?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
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
                text: 'No se pudo eliminar la cita',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/**
 * Carga la lista de pacientes en el select
 */
async function loadPacientesSelect() {
    try {
        const response = await fetch('/api/pacientes');
        if (!response.ok) throw new Error('Error al cargar pacientes');
        
        const pacientes = await response.json();
        const select = document.getElementById('pacienteId');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccionar paciente...</option>';
            pacientes.forEach(paciente => {
                const option = document.createElement('option');
                option.value = paciente.id;
                option.textContent = `${paciente.nombre} ${paciente.apellido}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar pacientes:', error);
        // Si falla, mostrar opción por defecto
        const select = document.getElementById('pacienteId');
        if (select) {
            select.innerHTML = '<option value="">Error al cargar pacientes</option>';
        }
    }
}

/**
 * Carga la lista de odontólogos en el select
 */
async function loadOdontologosSelect() {
    try {
        const response = await fetch('/api/odontologos');
        if (!response.ok) throw new Error('Error al cargar odontólogos');
        
        const odontologos = await response.json();
        const select = document.getElementById('odontologoId');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccionar odontólogo...</option>';
            odontologos.forEach(odontologo => {
                const option = document.createElement('option');
                option.value = odontologo.id;
                option.textContent = `Dr. ${odontologo.nombre} ${odontologo.apellido}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar odontólogos:', error);
        // Si falla, mostrar opción por defecto
        const select = document.getElementById('odontologoId');
        if (select) {
            select.innerHTML = '<option value="">Error al cargar odontólogos</option>';
        }
    }
}

/**
 * Carga la lista de tipos de cita en el select
 */
async function loadTiposCitaSelect() {
    try {
        const response = await fetch('/api/tipos-cita');
        if (!response.ok) throw new Error('Error al cargar tipos de cita');
        
        const tiposCita = await response.json();
        const select = document.getElementById('tipoCitaId');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccionar tipo de cita...</option>';
            tiposCita.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar tipos de cita:', error);
        // Si falla, mostrar opción por defecto
        const select = document.getElementById('tipoCitaId');
        if (select) {
            select.innerHTML = '<option value="">Error al cargar tipos de cita</option>';
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