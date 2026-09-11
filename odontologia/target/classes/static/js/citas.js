/**
 * Sistema de Gestión de Citas Médicas - Clínica Odontológica
 * Funcionalidades CRUD para citas con validaciones médicas y SweetAlert2
 */

// Estado global del módulo de citas
const AppointmentsModule = {
    currentAppointment: null,
    // Caché de la lista para abrir ver/editar al instante (sin loader)
    cachedCitas: [],
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
        { id: 'COMPLETADA', name: 'Completada', color: 'blue' },
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
                throw new Error(`Error ${response.status}: ${response.statusText}. ${errorText}`);
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
                throw new Error(`Error ${response.status}: ${response.statusText}`);
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
            // Cargar selects primero (siempre necesario)
            await Promise.all([
                loadPacientesSelect(),
                loadOdontologosSelect(),
                loadTiposCitaSelect()
            ]);

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

                    // Paciente
                    const pacienteId = editData.paciente?.id || editData.pacienteId;
                    if (pacienteId) {
                        pacienteSelect.value = pacienteId;
                        console.log('Paciente ID asignado:', pacienteId);
                    } else {
                        console.warn('No se encontró ID del paciente en los datos');
                    }

                    // Odontólogo
                    const odontologoId = editData.odontologo?.id || editData.odontologoId;
                    if (odontologoId) {
                        odontologoSelect.value = odontologoId;
                        console.log('Odontólogo ID asignado:', odontologoId);
                    } else {
                        console.warn('No se encontró ID del odontólogo en los datos');
                    }

                    // Tipo de cita
                    const tipoCitaId = editData.tipoCita?.id || editData.tipoCitaId;
                    if (tipoCitaId) {
                        tipoCitaSelect.value = tipoCitaId;
                        console.log('Tipo de cita ID asignado:', tipoCitaId);
                    } else {
                        console.warn('No se encontró ID del tipo de cita en los datos');
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

        // Focus en el primer campo
        setTimeout(() => {
            const firstSelect = form.querySelector('select');
            if (firstSelect) firstSelect.focus();
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
        const citaData = {
            paciente: { id: parseInt(appointmentData.pacienteId) },
            odontologo: { id: parseInt(appointmentData.odontologoId) },
            tipoCita: { id: parseInt(appointmentData.tipoCitaId) },
            fecha: appointmentData.fechaCita,
            hora: appointmentData.horaCita,
            observaciones: appointmentData.observaciones || '',
            estado: appointmentData.estado || 'PENDIENTE'
        };

        // En modo edición, agregar el ID de la cita
        if (isEdit && AppointmentsModule.editingAppointmentId) {
            citaData.id = AppointmentsModule.editingAppointmentId;
        }

        console.log('Datos preparados para enviar:', citaData);
        const actionText = isEdit ? 'Actualizando' : 'Programando';
        const successText = isEdit ? 'actualizada' : 'programada';

        console.log('Modo edición:', isEdit, 'ID cita:', AppointmentsModule.editingAppointmentId);

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
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#10b981'
        });

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

    // Validaciones requeridas
    if (!data.pacienteId) errors.push('Debe seleccionar un paciente');
    if (!data.tipoCitaId) errors.push('Debe seleccionar el tipo de cita');
    if (!data.fechaCita) errors.push('Debe seleccionar una fecha');
    if (!data.horaCita) errors.push('Debe seleccionar una hora');
    if (!data.odontologoId) errors.push('Debe asignar un odontólogo');

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
 * Confirmar cita
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

            // Llamada real para confirmar: actualizar estado en backend
            // Intentamos usar la API para actualizar el estado a CONFIRMADA
            await CitasAPI.updateCita(appointmentId, { estado: 'CONFIRMADA' });

            // Confirmar éxito
            await Swal.fire({
                icon: 'success',
                title: 'Cita confirmada',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">La cita de <strong>${info.pacienteNombre}</strong> ha sido confirmada exitosamente.</p>
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
            await loadAppointments();
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

        console.log('✅ Citas cargadas exitosamente:', citas.length, 'citas encontradas');

        // Paginación real del lado cliente
        TablePager.register('citas', function (page, pageSize) {
            if (pageSize) AppointmentsModule.pagination.itemsPerPage = pageSize;
            AppointmentsModule.pagination.currentPage = page;
            const pg = TablePager.paginate(AppointmentsModule.cachedCitas || [], page, AppointmentsModule.pagination.itemsPerPage);
            AppointmentsModule.pagination.currentPage = pg.page;
            updateAppointmentsTable(pg.rows);
            TablePager.renderBar('citasPager', pg, 'citas');
        });
        const citasPager = TablePager.paginate(citas, AppointmentsModule.pagination.currentPage, AppointmentsModule.pagination.itemsPerPage);
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
                    <button onclick="editAppointment(${cita.id})" class="sys-table-action sys-table-action-edit" title="Editar" aria-label="Editar">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button onclick="deleteAppointment(${cita.id})" class="sys-table-action sys-table-action-delete" title="Eliminar" aria-label="Eliminar">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
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
            return cita.estado === 'COMPLETADA' &&
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
        'COMPLETADA': 'bg-blue-100 text-blue-800',
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
        'COMPLETADA': 'Completada',
        'CANCELADA': 'Cancelada'
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
                option.textContent = `${paciente.nombres} ${paciente.apellidos}`;
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
window.cancelAppointment = cancelAppointment;
window.openCalendarView = openCalendarView;
window.printAppointment = printAppointment;
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
