/**
 * Sistema de Gestión de Historias Clínicas - Clínica Odontológica
 * Funcionalidades CRUD para historias clínicas con validaciones médicas y SweetAlert2
 */

// Estado global del módulo de historias clínicas
const MedicalRecordsModule = {
    currentRecord: null,
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
    recordStatuses: [
        { id: 'abierta', name: 'Abierta', color: 'blue' },
        { id: 'en-tratamiento', name: 'En Tratamiento', color: 'yellow' },
        { id: 'seguimiento', name: 'En Seguimiento', color: 'purple' },
        { id: 'cerrada', name: 'Cerrada', color: 'green' }
    ],
    prognosis: [
        { id: 'excelente', name: 'Excelente', color: 'green' },
        { id: 'bueno', name: 'Bueno', color: 'blue' },
        { id: 'regular', name: 'Regular', color: 'yellow' },
        { id: 'reservado', name: 'Reservado', color: 'orange' },
        { id: 'malo', name: 'Malo', color: 'red' }
    ]
};

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.dataset.page === 'historias-clinicas') {
        initializeMedicalRecordsModule();
    }
});

/**
 * Inicializa el módulo de historias clínicas
 */
function initializeMedicalRecordsModule() {
    console.log('📋🦷 Inicializando módulo de historias clínicas');
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos iniciales
    loadMedicalRecords();
    
    // Configurar filtros
    setupFilters();
    
    // Mostrar mensaje de bienvenida
    showWelcomeMessage();
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Formulario de nueva historia clínica
    const newRecordForm = document.getElementById('newRecordForm');
    if (newRecordForm) {
        newRecordForm.addEventListener('submit', handleNewRecordSubmit);
    }
    
    // Selector de paciente para generar número de historia
    const pacienteSelect = document.getElementById('pacienteId');
    if (pacienteSelect) {
        pacienteSelect.addEventListener('change', generateRecordNumber);
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
 * Abre el modal para crear una nueva historia clínica
 */
function openNewRecordModal() {
    const modal = document.getElementById('newRecordModal');
    const form = document.getElementById('newRecordForm');
    
    if (modal && form) {
        // Limpiar formulario
        form.reset();
        
        // Limpiar número de historia
        document.getElementById('numeroHistoria').value = '';
        
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
 * Cierra el modal de nueva historia clínica
 */
function closeNewRecordModal() {
    const modal = document.getElementById('newRecordModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

/**
 * Genera automáticamente el número de historia clínica
 */
function generateRecordNumber() {
    const pacienteSelect = document.getElementById('pacienteId');
    const numeroHistoriaInput = document.getElementById('numeroHistoria');
    
    if (pacienteSelect && numeroHistoriaInput && pacienteSelect.value) {
        // Generar número de historia clínica basado en fecha y ID del paciente
        const fecha = new Date();
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const pacienteId = pacienteSelect.value.padStart(3, '0');
        const numeroHistoria = `HC-${year}${month}${pacienteId}`;
        
        numeroHistoriaInput.value = numeroHistoria;
    }
}

/**
 * Maneja el envío del formulario de nueva historia clínica
 */
async function handleNewRecordSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const recordData = Object.fromEntries(formData);
    
    // Validar datos
    const validation = validateRecordData(recordData);
    if (!validation.isValid) {
        showValidationError(validation.errors);
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Creando historia clínica...',
            html: 'Por favor espere mientras procesamos la información médica',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Simular llamada a la API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular respuesta exitosa
        const newRecord = {
            id: Date.now(),
            ...recordData,
            fechaCreacion: new Date().toISOString(),
            estado: 'abierta',
            odontologo: 'Dr. Roberto Martínez' // Simular odontólogo actual
        };
        
        // Cerrar modal
        closeNewRecordModal();
        
        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Historia clínica creada!',
            html: `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-file-medical text-4xl text-teal-500 mb-2"></i>
                    </div>
                    <p class="text-gray-600">La historia clínica <strong>${recordData.numeroHistoria}</strong> ha sido creada exitosamente.</p>
                    <div class="mt-4 p-3 bg-teal-50 rounded-lg">
                        <p class="text-sm text-teal-700">
                            <i class="fas fa-info-circle mr-1"></i>
                            Diagnóstico: ${recordData.diagnosticoPrincipal}
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0d9488'
        });
        
        // Recargar lista
        loadMedicalRecords();
        
    } catch (error) {
        console.error('Error al crear historia clínica:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error al crear historia',
            text: 'No se pudo crear la historia clínica. Por favor intente nuevamente.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Valida los datos de la historia clínica
 */
function validateRecordData(data) {
    const errors = [];
    
    // Validaciones requeridas
    if (!data.pacienteId) errors.push('Debe seleccionar un paciente');
    if (!data.motivoConsulta?.trim()) errors.push('El motivo de consulta es requerido');
    if (!data.diagnosticoPrincipal?.trim()) errors.push('El diagnóstico principal es requerido');
    if (!data.planTratamiento?.trim()) errors.push('El plan de tratamiento es requerido');
    
    // Validación de campos de texto mínimos
    if (data.motivoConsulta && data.motivoConsulta.trim().length < 10) {
        errors.push('El motivo de consulta debe tener al menos 10 caracteres');
    }
    
    if (data.diagnosticoPrincipal && data.diagnosticoPrincipal.trim().length < 5) {
        errors.push('El diagnóstico principal debe ser más específico');
    }
    
    if (data.planTratamiento && data.planTratamiento.trim().length < 20) {
        errors.push('El plan de tratamiento debe ser más detallado (mínimo 20 caracteres)');
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
 * Ver detalles de una historia clínica
 */
async function viewRecord(recordId) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Cargando historia clínica...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Datos simulados de la historia clínica
        const record = getSimulatedRecord(recordId);
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar modal de detalles
        showRecordDetailsModal(record);
        
    } catch (error) {
        console.error('Error al cargar historia clínica:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la historia clínica.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Muestra el modal con los detalles de la historia clínica
 */
function showRecordDetailsModal(record) {
    // Llenar datos en el modal
    document.getElementById('viewRecordTitle').textContent = `Historia Clínica - ${record.numeroHistoria}`;
    document.getElementById('viewRecordPatient').textContent = record.pacienteNombre;
    document.getElementById('viewRecordNumber').textContent = record.numeroHistoria;
    document.getElementById('viewRecordDate').textContent = formatDate(record.fechaCreacion);
    
    // Llenar detalles clínicos
    document.getElementById('viewMotivoConsulta').textContent = record.motivoConsulta || 'No especificado';
    document.getElementById('viewHistoriaEnfermedad').textContent = record.historiaEnfermedad || 'No especificado';
    document.getElementById('viewDiagnosticoPrincipal').textContent = record.diagnosticoPrincipal || 'No especificado';
    document.getElementById('viewDiagnosticosSecundarios').textContent = record.diagnosticosSecundarios || 'No especificados';
    
    // Estados y badges
    const statusElement = document.getElementById('viewRecordStatus');
    const doctorElement = document.getElementById('viewRecordDoctor');
    
    const status = MedicalRecordsModule.recordStatuses.find(s => s.id === record.estado);
    if (status) {
        statusElement.textContent = status.name;
        statusElement.className = `inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800`;
    }
    
    doctorElement.textContent = record.odontologo || 'No asignado';
    
    // Actualizar avatar
    const avatar = document.getElementById('viewRecordAvatar');
    avatar.innerHTML = getPatientInitials(record.pacienteNombre);
    
    // Guardar referencia de la historia actual
    MedicalRecordsModule.currentRecord = record;
    
    // Mostrar modal
    const modal = document.getElementById('viewRecordModal');
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Cierra el modal de detalles de la historia clínica
 */
function closeViewRecordModal() {
    const modal = document.getElementById('viewRecordModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    MedicalRecordsModule.currentRecord = null;
}

/**
 * Editar historia clínica
 */
function editRecord(recordId) {
    console.log('Editar historia clínica:', recordId);
    
    Swal.fire({
        icon: 'info',
        title: 'Función en desarrollo',
        text: 'La edición de historias clínicas estará disponible próximamente.',
        confirmButtonColor: '#3b82f6'
    });
}

/**
 * Editar historia desde el modal de detalles
 */
function editRecordFromModal() {
    if (MedicalRecordsModule.currentRecord) {
        closeViewRecordModal();
        editRecord(MedicalRecordsModule.currentRecord.id);
    }
}

/**
 * Agregar nueva entrada a la historia clínica
 */
function addEntry(recordId) {
    console.log('Agregar entrada a historia clínica:', recordId);
    
    Swal.fire({
        icon: 'info',
        title: 'Agregar entrada...',
        html: `
            <div class="text-center">
                <i class="fas fa-plus text-4xl text-green-500 mb-3"></i>
                <p class="text-gray-600">Abriendo formulario para agregar nueva entrada médica.</p>
            </div>
        `,
        timer: 1500,
        confirmButtonColor: '#10b981'
    });
}

/**
 * Agregar entrada desde el modal
 */
function addEntryFromModal() {
    if (MedicalRecordsModule.currentRecord) {
        closeViewRecordModal();
        addEntry(MedicalRecordsModule.currentRecord.id);
    }
}

/**
 * Ver tratamientos de una historia clínica
 */
function viewTreatments(recordId) {
    console.log('Ver tratamientos de historia clínica:', recordId);
    
    Swal.fire({
        icon: 'info',
        title: 'Cargando tratamientos...',
        html: `
            <div class="text-center">
                <i class="fas fa-procedures text-4xl text-purple-500 mb-3"></i>
                <p class="text-gray-600">Cargando lista de tratamientos y procedimientos realizados.</p>
            </div>
        `,
        timer: 1500,
        confirmButtonColor: '#8b5cf6'
    });
}

/**
 * Generar reporte de la historia clínica
 */
function generateReport(recordId) {
    console.log('Generar reporte de historia clínica:', recordId);
    
    Swal.fire({
        icon: 'info',
        title: 'Generando reporte...',
        html: `
            <div class="text-center">
                <i class="fas fa-file-pdf text-4xl text-orange-500 mb-3"></i>
                <p class="text-gray-600">Generando reporte en PDF de la historia clínica.</p>
            </div>
        `,
        timer: 2000,
        confirmButtonColor: '#f59e0b'
    });
}

/**
 * Archivar historia clínica
 */
async function archiveRecord(recordId) {
    // Obtener datos de la historia clínica
    const record = getSimulatedRecord(recordId);
    
    const result = await Swal.fire({
        icon: 'question',
        title: '¿Archivar historia clínica?',
        html: `
            <div class="text-center">
                <div class="mb-4">
                    <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-archive text-yellow-600 text-xl"></i>
                    </div>
                    <p class="text-gray-700 mb-2">Historia clínica: <strong>${record.numeroHistoria}</strong></p>
                    <p class="text-sm text-gray-500">Paciente: ${record.pacienteNombre}</p>
                </div>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p class="text-yellow-800 text-sm">
                        <i class="fas fa-info-circle mr-2"></i>
                        Al archivar la historia clínica, se marcará como inactiva pero se conservará toda la información para consultas futuras.
                    </p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, archivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280'
    });
    
    if (result.isConfirmed) {
        try {
            // Mostrar progreso
            Swal.fire({
                title: 'Archivando historia clínica...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Simular archivado
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Confirmar archivado
            await Swal.fire({
                icon: 'success',
                title: 'Historia clínica archivada',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">La historia clínica <strong>${record.numeroHistoria}</strong> ha sido archivada exitosamente.</p>
                        <div class="mt-4 p-3 bg-green-50 rounded-lg">
                            <p class="text-sm text-green-700">
                                <i class="fas fa-check-circle mr-1"></i>
                                La información se mantiene disponible para consultas
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#10b981'
            });
            
            // Recargar lista
            loadMedicalRecords();
            
        } catch (error) {
            console.error('Error al archivar historia clínica:', error);
            
            Swal.fire({
                icon: 'error',
                title: 'Error al archivar',
                text: 'No se pudo archivar la historia clínica.',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/**
 * Carga la lista de historias clínicas
 */
async function loadMedicalRecords() {
    try {
        console.log('📋 Cargando historias clínicas...');
        
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ Historias clínicas cargadas exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar historias clínicas:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo cargar la lista de historias clínicas.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Configura los filtros
 */
function setupFilters() {
    console.log('🔍 Filtros de historias clínicas configurados');
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
        
        MedicalRecordsModule.filters = {
            search: searchInput?.value || '',
            estado: estadoSelect?.value || '',
            odontologo: odontologoSelect?.value || '',
            fecha: fechaSelect?.value || ''
        };
        
        console.log('🔍 Aplicando filtros:', MedicalRecordsModule.filters);
        
        // Simular filtrado
        Swal.fire({
            icon: 'success',
            title: 'Filtros aplicados',
            text: 'La lista de historias clínicas ha sido filtrada según los criterios seleccionados.',
            timer: 1500,
            showConfirmButton: false
        });
        
        loadMedicalRecords();
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
        
        MedicalRecordsModule.filters = {
            search: '',
            estado: '',
            odontologo: '',
            fecha: ''
        };
        
        console.log('🧹 Filtros limpiados');
        
        loadMedicalRecords();
    }
}

/**
 * Maneja la búsqueda en tiempo real
 */
function handleSearchInput(e) {
    const query = e.target.value.trim();
    console.log('🔍 Búsqueda en tiempo real:', query);
    
    MedicalRecordsModule.filters.search = query;
    loadMedicalRecords();
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
    console.log('👋 Bienvenido al módulo de historias clínicas');
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
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Obtener iniciales del paciente para el avatar
 */
function getPatientInitials(nombre) {
    if (!nombre) return '<span class="text-teal-600 font-bold text-xl">HC</span>';
    
    const parts = nombre.split(' ');
    const firstInitial = parts[0]?.charAt(0)?.toUpperCase() || '';
    const lastInitial = parts[1]?.charAt(0)?.toUpperCase() || '';
    return `<span class="text-teal-600 font-bold text-xl">${firstInitial}${lastInitial}</span>`;
}

/**
 * Obtener datos simulados de una historia clínica
 */
function getSimulatedRecord(recordId) {
    const records = {
        1: {
            id: 1,
            numeroHistoria: 'HC-202410001',
            pacienteId: 1,
            pacienteNombre: 'María González',
            odontologo: 'Dr. Roberto Martínez',
            odontologoEspecialidad: 'Ortodoncia',
            motivoConsulta: 'Dolor en muela superior derecha y dificultad para masticar',
            historiaEnfermedad: 'Paciente refiere dolor de 3 días de evolución, tipo punzante, que se intensifica con alimentos fríos y calientes',
            antecedentesMedicos: 'Hipertensión arterial controlada con medicamentos',
            antecedentesOdontologicos: 'Ortodoncia en la adolescencia, últimas curaciones hace 2 años',
            alergiasMedicamentos: 'Alergia a la penicilina',
            antecedentesFamiliares: 'Madre con diabetes tipo 2',
            examenExtraoral: 'Paciente en buen estado general, sin adenopatías palpables',
            examenIntraoral: 'Higiene oral regular, presencia de cálculo dental',
            estadoPeriodontal: 'Gingivitis leve generalizada',
            oclusion: 'Clase I de Angle, leve apiñamiento en sector anterior inferior',
            diagnosticoPrincipal: 'Maloclusión Clase II',
            diagnosticosSecundarios: 'Gingivitis crónica, caries dental',
            planTratamiento: 'Tratamiento ortodóncico con brackets metálicos, profilaxis inicial, tratamiento periodontal básico',
            pronostico: 'bueno',
            estado: 'en-tratamiento',
            fechaCreacion: '2024-10-15T10:30:00',
            ultimaActualizacion: '2024-10-15T14:30:00'
        },
        2: {
            id: 2,
            numeroHistoria: 'HC-202410002',
            pacienteId: 2,
            pacienteNombre: 'Juan Pérez',
            odontologo: 'Dra. María López',
            odontologoEspecialidad: 'Endodoncia',
            motivoConsulta: 'Dolor intenso en molar inferior izquierdo',
            historiaEnfermedad: 'Dolor intenso de 1 semana de evolución, aumenta por las noches',
            antecedentesMedicos: 'Sin antecedentes médicos relevantes',
            antecedentesOdontologicos: 'Primera consulta odontológica en 5 años',
            alergiasMedicamentos: 'No refiere alergias conocidas',
            antecedentesFamiliares: 'Padre con enfermedad cardiovascular',
            examenExtraoral: 'Leve asimetría facial por edema',
            examenIntraoral: 'Caries profunda en molar 36, resto de piezas con múltiples caries',
            estadoPeriodontal: 'Periodontitis leve localizada',
            oclusion: 'Clase I, pérdida de dimensión vertical posterior',
            diagnosticoPrincipal: 'Caries profunda molar',
            diagnosticosSecundarios: 'Periodontitis, múltiples caries',
            planTratamiento: 'Tratamiento endodóncico molar 36, rehabilitación oral integral',
            pronostico: 'bueno',
            estado: 'seguimiento',
            fechaCreacion: '2024-10-12T08:15:00',
            ultimaActualizacion: '2024-10-12T11:45:00'
        }
    };
    
    return records[recordId] || records[1];
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
window.MedicalRecordsModule = MedicalRecordsModule;
window.openNewRecordModal = openNewRecordModal;
window.closeNewRecordModal = closeNewRecordModal;
window.viewRecord = viewRecord;
window.closeViewRecordModal = closeViewRecordModal;
window.editRecord = editRecord;
window.editRecordFromModal = editRecordFromModal;
window.addEntry = addEntry;
window.addEntryFromModal = addEntryFromModal;
window.viewTreatments = viewTreatments;
window.generateReport = generateReport;
window.archiveRecord = archiveRecord;
window.toggleFilters = toggleFilters;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
