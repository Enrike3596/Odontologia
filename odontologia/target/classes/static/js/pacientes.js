/**
 * Sistema de Gestión de Pacientes - Clínica Odontológica
 * Funcionalidades CRUD para pacientes con validaciones y SweetAlert2
 */

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
    
    if (modal && form) {
        // Limpiar formulario
        form.reset();
        
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
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

/**
 * Maneja el envío del formulario de nuevo paciente
 */
async function handleNewPatientSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const patientData = Object.fromEntries(formData);
    
    // Validar datos
    const validation = validatePatientData(patientData);
    if (!validation.isValid) {
        showValidationError(validation.errors);
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Registrando paciente...',
            html: 'Por favor espere mientras procesamos la información',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Simular llamada a la API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simular respuesta exitosa
        const newPatient = {
            id: Date.now(),
            ...patientData,
            fechaRegistro: new Date().toISOString(),
            estado: 'activo',
            ultimaCita: null
        };
        
        // Cerrar modal
        closeNewPatientModal();
        
        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Paciente registrado!',
            html: `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-user-injured text-4xl text-green-500 mb-2"></i>
                    </div>
                    <p class="text-gray-600">El paciente <strong>${patientData.nombres} ${patientData.apellidos}</strong> ha sido registrado exitosamente en el sistema.</p>
                    <div class="mt-4 p-3 bg-green-50 rounded-lg">
                        <p class="text-sm text-green-700">
                            <i class="fas fa-info-circle mr-1"></i>
                            Ya puede agendar citas y gestionar su historia clínica
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
        console.error('Error al registrar paciente:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error al registrar',
            text: 'No se pudo registrar el paciente. Por favor intente nuevamente.',
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
        
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Datos simulados del paciente
        const patient = getSimulatedPatient(patientId);
        
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
function editPatient(patientId) {
    console.log('Editar paciente:', patientId);
    
    Swal.fire({
        icon: 'info',
        title: 'Función en desarrollo',
        text: 'La edición de pacientes estará disponible próximamente.',
        confirmButtonColor: '#3b82f6'
    });
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
 * Ver historia clínica
 */
function viewHistory(patientId) {
    console.log('Ver historia clínica del paciente:', patientId);
    
    Swal.fire({
        icon: 'info',
        title: 'Redirigiendo...',
        text: 'Abriendo historia clínica del paciente.',
        timer: 1500,
        confirmButtonColor: '#16a34a'
    });
}

/**
 * Ver historia clínica desde el modal
 */
function viewHistoryFromModal() {
    if (PatientsModule.currentPatient) {
        closeViewPatientModal();
        viewHistory(PatientsModule.currentPatient.id);
    }
}

/**
 * Agendar nueva cita para un paciente
 */
function scheduleAppointment(patientId) {
    console.log('Agendar cita para paciente:', patientId);
    
    Swal.fire({
        icon: 'info',
        title: 'Redirigiendo...',
        text: 'Abriendo módulo de agendamiento de citas.',
        timer: 1500,
        confirmButtonColor: '#8b5cf6'
    });
}

/**
 * Eliminar paciente
 */
async function deletePatient(patientId) {
    // Obtener datos del paciente
    const patient = getSimulatedPatient(patientId);
    
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
                    <p class="text-sm text-gray-500">${patient.tipoDocumento} ${patient.documento}</p>
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
            
            // Simular eliminación
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Confirmar eliminación
            await Swal.fire({
                icon: 'success',
                title: 'Paciente eliminado',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">El paciente <strong>${patient.nombres} ${patient.apellidos}</strong> ha sido eliminado del sistema.</p>
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
}

/**
 * Carga la lista de pacientes
 */
async function loadPatients() {
    try {
        console.log('📋 Cargando lista de pacientes...');
        
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ Pacientes cargados exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar pacientes:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo cargar la lista de pacientes.',
            confirmButtonColor: '#dc2626'
        });
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
window.openNewPatientModal = openNewPatientModal;
window.closeNewPatientModal = closeNewPatientModal;
window.viewPatient = viewPatient;
window.closeViewPatientModal = closeViewPatientModal;
window.editPatient = editPatient;
window.editPatientFromModal = editPatientFromModal;
window.viewHistory = viewHistory;
window.viewHistoryFromModal = viewHistoryFromModal;
window.scheduleAppointment = scheduleAppointment;
window.deletePatient = deletePatient;
window.toggleFilters = toggleFilters;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
