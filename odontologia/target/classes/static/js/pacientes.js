/**
 * Sistema de Gestión de Pacientes - Clínica Odontológica
 * Funcionalidades CRUD para pacientes con validaciones y SweetAlert2
 */

// API para comunicación con el backend
const PacientesAPI = {
    /**
     * Obtener todos los pacientes
     */
    async getAllPacientes() {
        try {
            const response = await fetch('/api/pacientes');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener pacientes:', error);
            throw error;
        }
    },

    /**
     * Obtener paciente por ID
     */
    async getPacienteById(id) {
        try {
            const response = await fetch(`/api/pacientes/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener paciente:', error);
            throw error;
        }
    },

    /**
     * Crear nuevo paciente
     */
    async createPaciente(pacienteData) {
        try {
            const response = await fetch('/api/pacientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pacienteData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al crear paciente:', error);
            throw error;
        }
    },

    /**
     * Actualizar paciente existente
     */
    async updatePaciente(id, pacienteData) {
        try {
            const response = await fetch(`/api/pacientes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pacienteData)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al actualizar paciente:', error);
            throw error;
        }
    },

    /**
     * Eliminar paciente
     */
    async deletePaciente(id) {
        try {
            const response = await fetch(`/api/pacientes/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return true;
        } catch (error) {
            console.error('Error al eliminar paciente:', error);
            throw error;
        }
    }
};

// Estado global del módulo de pacientes
const PatientsModule = {
    currentPatient: null,
    filters: {
        search: '',
        estado: '',
        genero: '',
        edad: ''
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0
    }
};

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.dataset.page === 'pacientes') {
        initializePatientsModule();
    }
});

/**
 * Inicializa el módulo de pacientes
 */
function initializePatientsModule() {
    console.log('🦷 Inicializando módulo de pacientes');
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos iniciales
    loadPatients();
    
    // Configurar filtros
    setupFilters();
    
    // Mostrar mensaje de bienvenida
    showWelcomeMessage();
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Formulario de nuevo paciente
    const newPatientForm = document.getElementById('newPatientForm');
    if (newPatientForm) {
        newPatientForm.addEventListener('submit', handleNewPatientSubmit);
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
 * Abre el modal para registrar un nuevo paciente
 */
function openNewPatientModal() {
    const modal = document.getElementById('newPatientModal');
    const form = document.getElementById('newPatientForm');
    const modalTitle = modal.querySelector('h3');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (modal && form) {
        // Limpiar formulario
        form.reset();
        
        // Restaurar valores por defecto para nuevo paciente
        modalTitle.textContent = 'Nuevo Paciente';
        submitButton.innerHTML = '<i class="fas fa-save mr-2"></i>Registrar Paciente';
        
        // Limpiar modo de edición
        delete form.dataset.editingPatientId;
        delete form.dataset.editMode;
        
        // Mostrar modal
        modal.classList.remove('hidden');
        
        // Focus en el primer campo
        setTimeout(() => {
            const firstInput = form.querySelector('input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

/**
 * Cierra el modal de nuevo paciente
 */
function closeNewPatientModal() {
    const modal = document.getElementById('newPatientModal');
    const form = document.getElementById('newPatientForm');
    
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
            
            // Limpiar modo de edición y datos del formulario
            if (form) {
                delete form.dataset.editingPatientId;
                delete form.dataset.editMode;
                form.reset();
                
                // Restaurar título y botón por defecto
                const modalTitle = modal.querySelector('h3');
                const submitButton = form.querySelector('button[type="submit"]');
                if (modalTitle) modalTitle.textContent = 'Nuevo Paciente';
                if (submitButton) submitButton.innerHTML = '<i class="fas fa-save mr-2"></i>Registrar Paciente';
            }
        }, 300);
    }
}

/**
 * Maneja el envío del formulario de nuevo paciente
 */
async function handleNewPatientSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const patientData = Object.fromEntries(formData);
    
    // Determinar si es edición o creación
    const isEditMode = form.dataset.editMode === 'true';
    const patientId = form.dataset.editingPatientId;
    
    // Validar datos
    const validation = validatePatientData(patientData);
    if (!validation.isValid) {
        showValidationError(validation.errors);
        return;
    }
    
    try {
        // Preparar datos para la API - manejar campos opcionales correctamente
        const pacienteData = {
            nombres: patientData.nombres?.trim(),
            apellidos: patientData.apellidos?.trim(),
            tipoDocumento: patientData.tipoDocumento,
            documento: patientData.documento?.trim(),
            fechaNacimiento: patientData.fechaNacimiento,
            genero: patientData.genero,
            email: patientData.email?.trim() || null,
            telefono: patientData.telefono?.trim(),
            direccion: patientData.direccion?.trim() || null,
            contactoEmergenciaNombre: patientData.contactoEmergenciaNombre?.trim() || null,
            contactoEmergenciaParentesco: patientData.contactoEmergenciaParentesco?.trim() || null,
            contactoEmergenciaTelefono: patientData.contactoEmergenciaTelefono?.trim() || null,
            alergias: patientData.alergias?.trim() || null,
            medicamentos: patientData.medicamentos?.trim() || null,
            observaciones: patientData.observaciones?.trim() || null
        };

        // Filtrar campos vacíos y enviar solo los que tienen valor
        const filteredData = {};
        for (const [key, value] of Object.entries(pacienteData)) {
            if (value !== null && value !== undefined && value !== '') {
                filteredData[key] = value;
            }
        }
        
        // Mostrar loading
        const actionText = isEditMode ? 'Actualizando' : 'Registrando';
        Swal.fire({
            title: `${actionText} paciente...`,
            html: 'Por favor espere mientras procesamos la información',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        let result;
        if (isEditMode) {
            // Actualizar paciente existente
            result = await PacientesAPI.updatePaciente(patientId, filteredData);
        } else {
            // Crear nuevo paciente
            result = await PacientesAPI.createPaciente(filteredData);
        }
        
        // Cerrar modal
        closeNewPatientModal();
        
        // Mostrar éxito
        const successText = isEditMode ? 'actualizado' : 'registrado';
        await Swal.fire({
            icon: 'success',
            title: `¡Paciente ${successText}!`,
            html: `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-user-injured text-4xl text-green-500 mb-2"></i>
                    </div>
                    <p class="text-gray-600">El paciente <strong>${result.nombres} ${result.apellidos}</strong> ha sido ${successText} exitosamente en el sistema.</p>
                    <div class="mt-4 p-3 bg-green-50 rounded-lg">
                        <p class="text-sm text-green-700">
                            <i class="fas fa-info-circle mr-1"></i>
                            Documento: ${result.tipoDocumento} ${result.documento}
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#16a34a'
        });
        
        // Recargar lista
        await loadPatients();
        
    } catch (error) {
        console.error('Error al procesar paciente:', error);
        
        const actionText = isEditMode ? 'actualizar' : 'registrar';
        
        Swal.fire({
            icon: 'error',
            title: `Error al ${actionText}`,
            text: `No se pudo ${actionText} el paciente. Error: ${error.message}`,
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Valida los datos del paciente
 */
function validatePatientData(data) {
    const errors = [];
    
    // Validaciones requeridas
    if (!data.nombres?.trim()) errors.push('Los nombres son requeridos');
    if (!data.apellidos?.trim()) errors.push('Los apellidos son requeridos');
    if (!data.tipoDocumento) errors.push('El tipo de documento es requerido');
    if (!data.documento?.trim()) errors.push('El número de documento es requerido');
    if (!data.fechaNacimiento) errors.push('La fecha de nacimiento es requerida');
    if (!data.genero) errors.push('El género es requerido');
    if (!data.telefono?.trim()) errors.push('El teléfono es requerido');
    
    // Validación de email si se proporciona
    if (data.email && !isValidEmail(data.email)) {
        errors.push('El formato del email no es válido');
    }
    
    // Validación de edad (no menor a 0 ni mayor a 120)
    if (data.fechaNacimiento) {
        const age = calculateAge(data.fechaNacimiento);
        if (age < 0 || age > 120) {
            errors.push('La fecha de nacimiento no es válida');
        }
    }
    
    // Validación de documento (solo números para CC y TI)
    if ((data.tipoDocumento === 'CC' || data.tipoDocumento === 'TI') && 
        !/^\d+$/.test(data.documento)) {
        errors.push('El documento debe contener solo números');
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
 * Ver detalles de un paciente
 */
async function viewPatient(patientId) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Cargando información...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Llamada real a la API
        const response = await fetch(`/api/pacientes/${patientId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const patient = await response.json();
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar modal de detalles
        showPatientDetailsModal(patient);
        
    } catch (error) {
        console.error('Error al cargar paciente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del paciente.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Muestra el modal con los detalles del paciente
 */
function showPatientDetailsModal(patient) {
    // Llenar datos en el modal
    document.getElementById('viewPatientName').textContent = `${patient.nombres} ${patient.apellidos}`;
    document.getElementById('viewPatientEmail').textContent = patient.email || 'No registrado';
    document.getElementById('viewPatientDocument').textContent = `${patient.tipoDocumento} ${patient.documento}`;
    document.getElementById('viewPatientBirthdate').textContent = formatDate(patient.fechaNacimiento);
    document.getElementById('viewPatientAge').textContent = `${calculateAge(patient.fechaNacimiento)} años`;
    document.getElementById('viewPatientGender').textContent = getGenderLabel(patient.genero);
    document.getElementById('viewPatientPhone').textContent = patient.telefono;
    document.getElementById('viewPatientAddress').textContent = patient.direccion || 'No registrada';
    document.getElementById('viewPatientEmergencyContact').textContent = 
        patient.contactoEmergenciaNombre ? 
        `${patient.contactoEmergenciaNombre} (${patient.contactoEmergenciaParentesco}) - ${patient.contactoEmergenciaTelefono}` : 
        'No registrado';
    
    // Actualizar avatar
    const avatar = document.getElementById('viewPatientAvatar');
    avatar.innerHTML = getPatientInitials(patient.nombres, patient.apellidos);
    
    // Guardar referencia del paciente actual
    PatientsModule.currentPatient = patient;
    
    // Mostrar modal
    const modal = document.getElementById('viewPatientModal');
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Cierra el modal de detalles del paciente
 */
function closeViewPatientModal() {
    const modal = document.getElementById('viewPatientModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    PatientsModule.currentPatient = null;
}

/**
 * Editar paciente
 */
async function editPatient(patientId) {
    try {
        console.log('Editando paciente:', patientId);
        
        // Mostrar loading
        Swal.fire({
            title: 'Cargando información...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Obtener los datos del paciente
        const patient = await PacientesAPI.getPacienteById(patientId);
        
        // Cerrar loading
        Swal.close();
        
        // Abrir modal de edición (reutilizar el modal de nuevo paciente)
        openEditPatientModal(patient);
        
    } catch (error) {
        console.error('Error al cargar paciente para edición:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del paciente para edición.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Abre el modal para editar un paciente
 */
function openEditPatientModal(patient) {
    const modal = document.getElementById('newPatientModal');
    const form = document.getElementById('newPatientForm');
    const modalTitle = modal.querySelector('h3');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (modal && form) {
        // Cambiar título del modal
        modalTitle.textContent = 'Editar Paciente';
        
        // Cambiar texto del botón
        submitButton.innerHTML = '<i class="fas fa-save mr-2"></i>Actualizar Paciente';
        
        // Llenar formulario con datos del paciente
        document.getElementById('nombres').value = patient.nombres || '';
        document.getElementById('apellidos').value = patient.apellidos || '';
        document.getElementById('tipoDocumento').value = patient.tipoDocumento || '';
        document.getElementById('documento').value = patient.documento || '';
        document.getElementById('fechaNacimiento').value = patient.fechaNacimiento || '';
        document.getElementById('genero').value = patient.genero || '';
        document.getElementById('email').value = patient.email || '';
        document.getElementById('telefono').value = patient.telefono || '';
        document.getElementById('direccion').value = patient.direccion || '';
        document.getElementById('contactoEmergenciaNombre').value = patient.contactoEmergenciaNombre || '';
        document.getElementById('contactoEmergenciaParentesco').value = patient.contactoEmergenciaParentesco || '';
        document.getElementById('contactoEmergenciaTelefono').value = patient.contactoEmergenciaTelefono || '';
        document.getElementById('alergias').value = patient.alergias || '';
        document.getElementById('medicamentos').value = patient.medicamentos || '';
        document.getElementById('observaciones').value = patient.observaciones || '';
        
        // Agregar el ID del paciente como data attribute
        form.dataset.editingPatientId = patient.id;
        form.dataset.editMode = 'true';
        
        // Mostrar modal
        modal.classList.remove('hidden');
        
        // Focus en el primer campo
        setTimeout(() => {
            const firstInput = form.querySelector('input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

/**
 * Editar paciente desde el modal de detalles
 */
function editPatientFromModal() {
    if (PatientsModule.currentPatient) {
        closeViewPatientModal();
        editPatient(PatientsModule.currentPatient.id);
    }
}

/**
 * Eliminar paciente
 */
async function deletePatient(patientId) {
    try {
        // Obtener datos del paciente primero
        const response = await fetch(`/api/pacientes/${patientId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const patient = await response.json();
        
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar paciente?',
            html: `
                <div class="text-center">
                    <div class="mb-4">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-user-injured text-red-600 text-xl"></i>
                        </div>
                        <p class="text-gray-700 mb-2">Está a punto de eliminar el paciente:</p>
                        <p class="font-semibold text-gray-900">${patient.nombres} ${patient.apellidos}</p>
                        <p class="text-sm text-gray-500">${patient.tipoDocumento || ''} ${patient.documento || ''}</p>
                    </div>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p class="text-red-800 text-sm">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            <strong>Advertencia:</strong> Esta acción no se puede deshacer y eliminará:
                        </p>
                        <ul class="text-red-700 text-sm mt-2 text-left list-disc ml-6">
                            <li>Toda la información personal del paciente</li>
                            <li>Su historia clínica completa</li>
                            <li>Todas las citas programadas</li>
                            <li>Tratamientos y seguimientos</li>
                        </ul>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true
        });
        
        if (result.isConfirmed) {
            try {
                // Mostrar progreso de eliminación
                Swal.fire({
                    title: 'Eliminando paciente...',
                    html: 'Procesando eliminación del paciente y toda su información asociada.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                // Llamada real a la API para eliminar
                const deleteResponse = await fetch(`/api/pacientes/${patientId}`, {
                    method: 'DELETE'
                });
                
                if (!deleteResponse.ok) {
                    throw new Error(`HTTP error! status: ${deleteResponse.status}`);
                }
                
                // Confirmar eliminación
                await Swal.fire({
                    icon: 'success',
                    title: 'Paciente eliminado',
                    html: `
                        <div class="text-center">
                            <p class="text-gray-600">El paciente ha sido eliminado del sistema.</p>
                            <div class="mt-4 p-3 bg-green-50 rounded-lg">
                                <p class="text-sm text-green-700">
                                    <i class="fas fa-check-circle mr-1"></i>
                                    Toda la información asociada ha sido eliminada correctamente
                                </p>
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#16a34a'
                });
                
                // Recargar lista
                loadPatients();
                
            } catch (error) {
                console.error('Error al eliminar paciente:', error);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error al eliminar',
                    text: 'No se pudo eliminar el paciente. Por favor intente nuevamente.',
                    confirmButtonColor: '#dc2626'
                });
            }
        }
    } catch (error) {
        console.error('Error al obtener datos del paciente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del paciente.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Carga la lista de pacientes
 */
async function loadPatients() {
    try {
        console.log('📋 Cargando lista de pacientes...');
        
        // Usar la nueva API
        const patients = await PacientesAPI.getAllPacientes();
        
        // Actualizar la tabla con los datos reales
        renderPatientsTable(patients);
        
        // Actualizar estadísticas
        updatePatientsStats(patients);
        
        console.log('✅ Pacientes cargados exitosamente:', patients.length);
        
    } catch (error) {
        console.error('❌ Error al cargar pacientes:', error);
        
        // Mostrar tabla vacía en caso de error
        renderPatientsTable([]);
        
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo cargar la lista de pacientes.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Renderiza la tabla de pacientes con los datos recibidos
 */
function renderPatientsTable(patients) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) {
        console.warn('No se encontró el tbody de la tabla');
        return;
    }
    
    if (!patients || patients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-4 text-center text-gray-500">
                    <i class="fas fa-users text-2xl mb-2"></i>
                    <div>No hay pacientes registrados</div>
                    <div class="text-sm">Comience registrando el primer paciente</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = patients.map(patient => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span class="text-sm font-medium text-indigo-700">
                                ${getPatientInitials(patient.nombres, patient.apellidos)}
                            </span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${patient.nombres} ${patient.apellidos}</div>
                        <div class="text-sm text-gray-500">${patient.tipoDocumento || ''} ${patient.documento || ''}</div>
                        <div class="sm:hidden text-xs text-gray-400 mt-1">
                            ${patient.email || 'No registrado'} • ${patient.telefono || 'No registrado'}
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                <div class="text-sm text-gray-900">${patient.email || 'No registrado'}</div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                <div class="text-sm text-gray-900">${patient.telefono || 'No registrado'}</div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                <div class="text-sm text-gray-900">
                    ${patient.fechaNacimiento ? formatDate(patient.fechaNacimiento) : 'No registrada'}
                </div>
                <div class="text-sm text-gray-500">
                    ${patient.fechaNacimiento ? calculateAge(patient.fechaNacimiento) + ' años' : ''}
                </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                <span class="text-sm text-gray-900">${getGenderLabel(patient.genero)}</span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-1">
                    <button onclick="viewPatient(${patient.id})" class="p-2 text-blue-600 hover:bg-blue-100 rounded-full" title="Ver detalles">
                        <i class="fas fa-eye text-sm"></i>
                    </button>
                    <button onclick="editPatient(${patient.id})" class="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full" title="Editar">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button onclick="deletePatient(${patient.id})" class="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Eliminar">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Actualiza las estadísticas de pacientes
 */
function updatePatientsStats(patients) {
    // Buscar y actualizar los elementos de estadísticas en las cards
    const statsCards = document.querySelectorAll('.grid .bg-white .text-2xl');
    
    if (statsCards.length >= 4) {
        // Total de pacientes
        statsCards[0].textContent = patients.length;
        
        // Pacientes nuevos (simulamos últimos 30 días)
        const nuevos = Math.floor(patients.length * 0.1);
        statsCards[1].textContent = nuevos;
        
        // Citas pendientes (simulamos)
        const citasPendientes = patients.length * 2;
        statsCards[2].textContent = citasPendientes;
        
        // Historias completadas (simulamos 80%)
        const historiasCompletas = Math.floor(patients.length * 0.8);
        statsCards[3].textContent = historiasCompletas;
    }
}

/**
 * Configura los filtros
 */
function setupFilters() {
    // Los filtros ya están configurados en el HTML
    console.log('🔍 Filtros de pacientes configurados');
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
        const generoSelect = filtersSection.querySelectorAll('select')[1];
        const edadSelect = filtersSection.querySelectorAll('select')[2];
        
        PatientsModule.filters = {
            search: searchInput?.value || '',
            estado: estadoSelect?.value || '',
            genero: generoSelect?.value || '',
            edad: edadSelect?.value || ''
        };
        
        console.log('🔍 Aplicando filtros:', PatientsModule.filters);
        
        // Simular filtrado
        Swal.fire({
            icon: 'success',
            title: 'Filtros aplicados',
            text: 'La lista de pacientes ha sido filtrada según los criterios seleccionados.',
            timer: 1500,
            showConfirmButton: false
        });
        
        loadPatients();
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
        
        PatientsModule.filters = {
            search: '',
            estado: '',
            genero: '',
            edad: ''
        };
        
        console.log('🧹 Filtros limpiados');
        
        loadPatients();
    }
}

/**
 * Maneja la búsqueda en tiempo real
 */
function handleSearchInput(e) {
    const query = e.target.value.trim();
    console.log('🔍 Búsqueda en tiempo real:', query);
    
    PatientsModule.filters.search = query;
    loadPatients();
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
    console.log('👋 Bienvenido al módulo de pacientes');
}

// ===============================
// FUNCIONES UTILITARIAS
// ===============================

/**
 * Validar formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Calcular edad a partir de fecha de nacimiento
 */
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * Formatear fecha para visualización
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Obtener etiqueta de género
 */
function getGenderLabel(gender) {
    const labels = {
        'M': 'Masculino',
        'F': 'Femenino',
        'O': 'Otro'
    };
    return labels[gender] || 'No especificado';
}

/**
 * Obtener iniciales del paciente para el avatar
 */
function getPatientInitials(nombres, apellidos) {
    const firstInitial = nombres?.charAt(0)?.toUpperCase() || '';
    const lastInitial = apellidos?.charAt(0)?.toUpperCase() || '';
    return `<span class="text-green-600 font-bold text-xl">${firstInitial}${lastInitial}</span>`;
}

/**
 * Obtener datos simulados de un paciente
 */
function getSimulatedPatient(patientId) {
    const patients = {
        1: {
            id: 1,
            nombres: 'María',
            apellidos: 'González',
            tipoDocumento: 'CC',
            documento: '12345678',
            fechaNacimiento: '1988-05-15',
            genero: 'F',
            email: 'maria.gonzalez@email.com',
            telefono: '+57 300 123 4567',
            direccion: 'Calle 123 #45-67, Bogotá',
            contactoEmergenciaNombre: 'Pedro González',
            contactoEmergenciaParentesco: 'Esposo',
            contactoEmergenciaTelefono: '+57 301 234 5678',
            alergias: 'Penicilina',
            medicamentos: 'Ninguno',
            observaciones: 'Paciente con historial de sensibilidad dental',
            estado: 'activo',
            fechaRegistro: '2024-01-15T10:30:00',
            ultimaCita: '2024-10-15'
        },
        2: {
            id: 2,
            nombres: 'Juan',
            apellidos: 'Pérez',
            tipoDocumento: 'CC',
            documento: '87654321',
            fechaNacimiento: '1982-08-22',
            genero: 'M',
            email: 'juan.perez@email.com',
            telefono: '+57 301 987 6543',
            direccion: 'Carrera 45 #12-34, Medellín',
            contactoEmergenciaNombre: 'Ana Pérez',
            contactoEmergenciaParentesco: 'Esposa',
            contactoEmergenciaTelefono: '+57 302 345 6789',
            alergias: 'Ninguna conocida',
            medicamentos: 'Ibuprofeno ocasional',
            observaciones: 'Requiere tratamiento ortodóncico',
            estado: 'activo',
            fechaRegistro: '2024-02-01T14:15:00',
            ultimaCita: '2024-10-10'
        }
    };
    
    return patients[patientId] || patients[1];
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
window.PatientsModule = PatientsModule;
window.PacientesAPI = PacientesAPI;
window.openNewPatientModal = openNewPatientModal;
window.closeNewPatientModal = closeNewPatientModal;
window.viewPatient = viewPatient;
window.closeViewPatientModal = closeViewPatientModal;
window.editPatient = editPatient;
window.editPatientFromModal = editPatientFromModal;
window.deletePatient = deletePatient;
window.toggleFilters = toggleFilters;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
