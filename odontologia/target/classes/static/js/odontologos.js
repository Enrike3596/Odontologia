/**
 * Sistema de Gestión de Odontólogos - Clínica Odontológica
 * Funcionalidades CRUD para odontólogos con validaciones y SweetAlert2
 */

// API para comunicación con el backend
const OdontologosAPI = {
    /**
     * Obtener todos los odontólogos
     */
    async getAllOdontologos() {
        try {
            const response = await fetch('/api/odontologos');
            if (!response.ok) throw new Error('Error al obtener odontólogos');
            return await response.json();
        } catch (error) {
            console.error('Error en getAllOdontologos:', error);
            throw error;
        }
    },

    /**
     * Obtener odontólogo por ID
     */
    async getOdontologoById(id) {
        try {
            const response = await fetch(`/api/odontologos/${id}`);
            if (!response.ok) throw new Error('Error al obtener odontólogo');
            return await response.json();
        } catch (error) {
            console.error('Error en getOdontologoById:', error);
            throw error;
        }
    },

    /**
     * Crear nuevo odontólogo
     */
    async createOdontologo(odontologoData) {
        try {
            const response = await fetch('/api/odontologos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(odontologoData)
            });
            if (!response.ok) throw new Error('Error al crear odontólogo');
            return await response.json();
        } catch (error) {
            console.error('Error en createOdontologo:', error);
            throw error;
        }
    },

    /**
     * Actualizar odontólogo existente
     */
    async updateOdontologo(id, odontologoData) {
        try {
            const response = await fetch(`/api/odontologos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(odontologoData)
            });
            if (!response.ok) throw new Error('Error al actualizar odontólogo');
            return await response.json();
        } catch (error) {
            console.error('Error en updateOdontologo:', error);
            throw error;
        }
    },

    /**
     * Eliminar odontólogo
     */
    async deleteOdontologo(id) {
        try {
            const response = await fetch(`/api/odontologos/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar odontólogo');
            return true;
        } catch (error) {
            console.error('Error en deleteOdontologo:', error);
            throw error;
        }
    }
};

// Estado global del módulo de odontólogos
const DentistsModule = {
    currentDentist: null,
    // Caché de la lista para abrir ver/editar al instante (sin loader)
    cachedDentists: [],
    editMode: false,
    editingDentistId: null,
    filters: {
        search: '',
        especialidad: '',
        estado: '',
        disponibilidad: ''
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: TablePager.DEFAULT_PAGE_SIZE,
        totalItems: 0
    },
    specialties: [
        { id: 'general', name: 'Odontología General', color: 'green' },
        { id: 'ortododoncia', name: 'Ortodoncia', color: 'blue' },
        { id: 'endodoncia', name: 'Endodoncia', color: 'purple' },
        { id: 'periodoncia', name: 'Periodoncia', color: 'orange' },
        { id: 'cirugia', name: 'Cirugía Oral', color: 'red' },
        { id: 'protesis', name: 'Prótesis Dental', color: 'indigo' },
        { id: 'pediatrica', name: 'Odontopediatría', color: 'pink' },
        { id: 'estetica', name: 'Estética Dental', color: 'teal' }
    ]
};

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.dataset.page === 'odontologos') {
        initializeDentistsModule();
    }
});

/**
 * Inicializa el módulo de odontólogos
 */
function initializeDentistsModule() {
    console.log('🦷👨‍⚕️ Inicializando módulo de odontólogos');

    // Configurar eventos
    setupEventListeners();

    // Cargar datos iniciales
    loadDentists();

    // Configurar filtros
    setupFilters();

    // Mostrar mensaje de bienvenida
    showWelcomeMessage();
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Formulario de nuevo odontólogo
    const newDentistForm = document.getElementById('newDentistForm');
    if (newDentistForm) {
        newDentistForm.addEventListener('submit', handleNewDentistSubmit);
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
 * Abre el modal para registrar un nuevo odontólogo
 */
async function openNewDentistModal(editData = null) {
    const modal = document.getElementById('newDentistModal');
    const form = document.getElementById('newDentistForm');

    if (modal && form) {
        // Limpiar formulario
        form.reset();

        // Configurar modo (crear o editar)
        const isEditMode = editData !== null;
        DentistsModule.editMode = isEditMode;
        DentistsModule.editingDentistId = isEditMode ? editData.id : null;

        // Cambiar título del modal
        const modalTitle = modal.querySelector('h3');
        if (modalTitle) {
            modalTitle.textContent = isEditMode ? 'Editar Odontólogo' : 'Nuevo Odontólogo';
        }

        // Cambiar texto del botón
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = isEditMode ? 'Actualizar Odontólogo' : 'Registrar Odontólogo';
        }

        // Si es modo edición, cargar datos
        if (isEditMode) {
            try {
                // Llenar formulario con datos del odontólogo
                document.getElementById('nombre').value = editData.nombre || '';
                document.getElementById('apellido').value = editData.apellido || '';
                document.getElementById('matricula').value = editData.matricula || '';
                document.getElementById('tipoDocumento').value = editData.tipoDocumento || '';
                document.getElementById('documento').value = editData.documento || '';
                document.getElementById('fechaNacimiento').value = editData.fechaNacimiento || '';
                document.getElementById('genero').value = editData.genero || '';
                document.getElementById('email').value = editData.email || '';
                document.getElementById('telefono').value = editData.telefono || '';
                document.getElementById('direccion').value = editData.direccion || '';
                document.getElementById('universidad').value = editData.universidad || '';
                document.getElementById('anoGraduacion').value = editData.anoGraduacion || '';
                document.getElementById('experiencia').value = editData.experiencia || '';

                // Cargar especialidades como checkboxes
                if (editData.especialidades) {
                    const especialidadesArray = editData.especialidades.split(', ');
                    form.querySelectorAll('input[name="especialidades"]').forEach(checkbox => {
                        checkbox.checked = especialidadesArray.includes(checkbox.value);
                    });
                }

                document.getElementById('contactoEmergenciaNombre').value = editData.contactoEmergenciaNombre || '';
                document.getElementById('contactoEmergenciaParentesco').value = editData.contactoEmergenciaParentesco || '';
                document.getElementById('contactoEmergenciaTelefono').value = editData.contactoEmergenciaTelefono || '';

                // Cargar días de trabajo como checkboxes
                if (editData.diasTrabajo) {
                    const diasArray = editData.diasTrabajo.split(', ');
                    form.querySelectorAll('input[name="diasTrabajo"]').forEach(checkbox => {
                        checkbox.checked = diasArray.includes(checkbox.value);
                    });
                }

                document.getElementById('horaInicio').value = editData.horaInicio || '';
                document.getElementById('horaFin').value = editData.horaFin || '';
                document.getElementById('observaciones').value = editData.observaciones || '';

            } catch (error) {
                console.error('Error al cargar datos para edición:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos para editar el odontólogo.',
                    confirmButtonColor: '#dc2626'
                });
                return;
            }
        } else {
            // Restaurar valores por defecto para nuevo odontólogo
            const horaInicio = document.getElementById('horaInicio');
            const horaFin = document.getElementById('horaFin');
            if (horaInicio) horaInicio.value = '08:00';
            if (horaFin) horaFin.value = '17:00';

            // Marcar días laborales por defecto (lunes a viernes)
            const defaultDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            defaultDays.forEach(day => {
                const checkbox = form.querySelector(`input[name="diasTrabajo"][value="${day}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

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
 * Cierra el modal de nuevo odontólogo
 */
function closeNewDentistModal() {
    const modal = document.getElementById('newDentistModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

/**
 * Maneja el envío del formulario de nuevo odontólogo
 */
/**
 * Maneja el envío del formulario de nuevo odontólogo
 */
async function handleNewDentistSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Procesar campos de texto normales
    const dentistData = {};
    for (let [key, value] of formData.entries()) {
        if (key !== 'especialidades' && key !== 'diasTrabajo') {
            dentistData[key] = value;
        }
    }

    // Procesar especialidades seleccionadas
    const especialidadesSeleccionadas = [];
    const especialidadesCheckboxes = form.querySelectorAll('input[name="especialidades"]:checked');
    especialidadesCheckboxes.forEach(checkbox => {
        especialidadesSeleccionadas.push(checkbox.value);
    });
    dentistData.especialidades = especialidadesSeleccionadas.join(', ');

    // Procesar días de trabajo seleccionados
    const diasSeleccionados = [];
    const diasCheckboxes = form.querySelectorAll('input[name="diasTrabajo"]:checked');
    diasCheckboxes.forEach(checkbox => {
        diasSeleccionados.push(checkbox.value);
    });
    dentistData.diasTrabajo = diasSeleccionados.join(', ');

    // Validar datos completos
    const validation = validateCompleteDentistData(dentistData);
    if (!validation.isValid) {
        showValidationError(validation.errors);
        return;
    }

    try {
        // Preparar datos para la API
        const odontologoData = {
            nombre: dentistData.nombre.trim(),
            apellido: dentistData.apellido.trim(),
            matricula: dentistData.matricula.trim(),
            tipoDocumento: dentistData.tipoDocumento,
            documento: dentistData.documento.trim(),
            fechaNacimiento: dentistData.fechaNacimiento,
            genero: dentistData.genero,
            email: dentistData.email?.trim() || null,
            telefono: dentistData.telefono.trim(),
            direccion: dentistData.direccion?.trim() || null,
            universidad: dentistData.universidad.trim(),
            anoGraduacion: parseInt(dentistData.anoGraduacion),
            experiencia: parseInt(dentistData.experiencia),
            especialidades: dentistData.especialidades || null,
            contactoEmergenciaNombre: dentistData.contactoEmergenciaNombre?.trim() || null,
            contactoEmergenciaParentesco: dentistData.contactoEmergenciaParentesco?.trim() || null,
            contactoEmergenciaTelefono: dentistData.contactoEmergenciaTelefono?.trim() || null,
            diasTrabajo: dentistData.diasTrabajo || null,
            horaInicio: dentistData.horaInicio || null,
            horaFin: dentistData.horaFin || null,
            observaciones: dentistData.observaciones?.trim() || null
        };

        // Determinar si es creación o edición
        const isEdit = DentistsModule.editMode;
        const actionText = isEdit ? 'Actualizando' : 'Registrando';
        const successText = isEdit ? 'actualizado' : 'registrado';

        // Mostrar loading
        Swal.fire({
            title: `${actionText} odontólogo...`,
            html: 'Por favor espere mientras procesamos la información',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        let result;
        if (isEdit) {
            // Actualizar odontólogo existente
            result = await OdontologosAPI.updateOdontologo(DentistsModule.editingDentistId, odontologoData);
        } else {
            // Crear nuevo odontólogo
            result = await OdontologosAPI.createOdontologo(odontologoData);
        }

        // Cerrar modal
        closeNewDentistModal();

        // Resetear modo de edición
        DentistsModule.editMode = false;
        DentistsModule.editingDentistId = null;

        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: `¡Odontólogo ${successText}!`,
            html: `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-user-md text-4xl text-emerald-500 mb-2"></i>
                    </div>
                    <p class="text-gray-600">El Dr(a). <strong>${result.nombre} ${result.apellido}</strong> ha sido ${successText} exitosamente.</p>
                    <div class="mt-4 p-3 bg-emerald-50 rounded-lg">
                        <p class="text-sm text-emerald-700">
                            <i class="fas fa-info-circle mr-1"></i>
                            Matrícula: ${result.matricula}
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#10b981'
        });

        // Recargar lista
        await loadDentists();

    } catch (error) {
        console.error('Error al procesar odontólogo:', error);

        const actionText = DentistsModule.editMode ? 'actualizar' : 'registrar';

        Swal.fire({
            icon: 'error',
            title: `Error al ${actionText}`,
            text: `No se pudo ${actionText} el odontólogo. Por favor intente nuevamente.`,
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Valida los datos básicos del odontólogo
 */
function validateBasicDentistData(data) {
    const errors = [];

    // Validaciones requeridas
    if (!data.nombre?.trim()) errors.push('El nombre es requerido');
    if (!data.apellido?.trim()) errors.push('El apellido es requerido');
    if (!data.matricula?.trim()) errors.push('La matrícula profesional es requerida');

    // Validación de matrícula profesional (formato MP-XXXXX)
    if (data.matricula && !/^MP-\d{4,6}$/.test(data.matricula)) {
        errors.push('La matrícula debe tener el formato MP-XXXXX (4-6 dígitos)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida los datos completos del odontólogo
 */
function validateCompleteDentistData(data) {
    const errors = [];

    // Validaciones requeridas
    if (!data.nombre?.trim()) errors.push('El nombre es requerido');
    if (!data.apellido?.trim()) errors.push('El apellido es requerido');
    if (!data.tipoDocumento) errors.push('El tipo de documento es requerido');
    if (!data.documento?.trim()) errors.push('El número de documento es requerido');
    if (!data.fechaNacimiento) errors.push('La fecha de nacimiento es requerida');
    if (!data.genero) errors.push('El género es requerido');
    if (!data.matricula?.trim()) errors.push('La matrícula profesional es requerida');
    if (!data.universidad?.trim()) errors.push('La universidad es requerida');
    if (!data.anoGraduacion) errors.push('El año de graduación es requerido');
    if (!data.experiencia) errors.push('Los años de experiencia son requeridos');
    if (!data.telefono?.trim()) errors.push('El teléfono es requerido');

    // Validación de matrícula profesional (formato MP-XXXXX)
    if (data.matricula && !/^MP-\d{4,6}$/.test(data.matricula)) {
        errors.push('La matrícula debe tener el formato MP-XXXXX (4-6 dígitos)');
    }

    // Validación de email si se proporciona
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('El formato del email no es válido');
    }

    // Validaciones de rango para números
    const currentYear = new Date().getFullYear();
    if (data.anoGraduacion && (data.anoGraduacion < 1950 || data.anoGraduacion > currentYear)) {
        errors.push(`El año de graduación debe estar entre 1950 y ${currentYear}`);
    }

    if (data.experiencia && (data.experiencia < 0 || data.experiencia > 50)) {
        errors.push('Los años de experiencia deben estar entre 0 y 50');
    }

    // Validación de fecha de nacimiento (debe ser mayor de edad)
    if (data.fechaNacimiento) {
        const birthDate = new Date(data.fechaNacimiento);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
            errors.push('El odontólogo debe ser mayor de edad');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida los datos del odontólogo
 */
function validateDentistData(data) {
    const errors = [];

    // Validaciones requeridas
    if (!data.nombres?.trim()) errors.push('Los nombres son requeridos');
    if (!data.apellidos?.trim()) errors.push('Los apellidos son requeridos');
    if (!data.tipoDocumento) errors.push('El tipo de documento es requerido');
    if (!data.documento?.trim()) errors.push('El número de documento es requerido');
    if (!data.fechaNacimiento) errors.push('La fecha de nacimiento es requerida');
    if (!data.genero) errors.push('El género es requerido');
    if (!data.licenciaProfesional?.trim()) errors.push('La licencia profesional es requerida');
    if (!data.universidad?.trim()) errors.push('La universidad es requerida');
    if (!data.anoGraduacion) errors.push('El año de graduación es requerido');
    if (!data.experiencia) errors.push('Los años de experiencia son requeridos');
    if (!data.email?.trim()) errors.push('El email es requerido');
    if (!data.telefono?.trim()) errors.push('El teléfono es requerido');

    // Validación de especialidades
    if (!data.especialidades || data.especialidades.length === 0) {
        errors.push('Debe seleccionar al menos una especialidad');
    }

    // Validación de días de trabajo
    if (!data.diasTrabajo || data.diasTrabajo.length === 0) {
        errors.push('Debe seleccionar al menos un día de trabajo');
    }

    // Validación de email
    if (data.email && !isValidEmail(data.email)) {
        errors.push('El formato del email no es válido');
    }

    // Validación de edad (debe ser mayor de 22 años para ser odontólogo)
    if (data.fechaNacimiento) {
        const age = calculateAge(data.fechaNacimiento);
        if (age < 22) {
            errors.push('El odontólogo debe tener al menos 22 años');
        }
        if (age > 80) {
            errors.push('La fecha de nacimiento no es válida');
        }
    }

    // Validación de año de graduación
    const currentYear = new Date().getFullYear();
    if (data.anoGraduacion && (data.anoGraduacion < 1950 || data.anoGraduacion > currentYear)) {
        errors.push('El año de graduación no es válido');
    }

    // Validación de experiencia
    if (data.experiencia && (data.experiencia < 0 || data.experiencia > 50)) {
        errors.push('Los años de experiencia deben estar entre 0 y 50');
    }

    // Validación de licencia profesional (formato MP-XXXXX)
    if (data.licenciaProfesional && !/^MP-\d{4,6}$/.test(data.licenciaProfesional)) {
        errors.push('La licencia debe tener el formato MP-XXXXX (ej: MP-12345)');
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
 * Ver detalles de un odontólogo
 */
async function viewDentist(dentistId) {
    // Apertura instantánea desde caché (sin loader visible)
    const cached = (DentistsModule.cachedDentists || []).find(o => String(o.id) === String(dentistId));
    if (cached) {
        showDentistDetailsModal(cached);
        return;
    }

    try {
        // Respaldo: traer de la API con indicador (solo si no está en caché)
        Swal.fire({
            title: 'Cargando información...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Obtener datos reales de la API
        const dentist = await OdontologosAPI.getOdontologoById(dentistId);

        // Cerrar loading
        Swal.close();

        // Mostrar modal de detalles
        showDentistDetailsModal(dentist);

    } catch (error) {
        console.error('Error al cargar odontólogo:', error);
        Swal.close();

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del odontólogo.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Muestra el modal con los detalles del odontólogo
 */
function showDentistDetailsModal(dentist) {
    // Llenar datos en el modal con la estructura completa
    document.getElementById('viewDentistName').textContent = `Dr. ${dentist.nombre} ${dentist.apellido}`;
    document.getElementById('viewDentistEmail').textContent = dentist.email || 'No especificado';
    document.getElementById('viewDentistDocument').textContent = `${dentist.tipoDocumento || ''} ${dentist.documento || 'No especificado'}`;
    document.getElementById('viewDentistBirthdate').textContent = dentist.fechaNacimiento || 'No especificado';
    document.getElementById('viewDentistGender').textContent = getGenderText(dentist.genero) || 'No especificado';
    document.getElementById('viewDentistPhone').textContent = dentist.telefono || 'No especificado';
    document.getElementById('viewDentistAddress').textContent = dentist.direccion || 'No especificado';
    document.getElementById('viewDentistLicense').textContent = dentist.matricula;
    document.getElementById('viewDentistUniversity').textContent = dentist.universidad || 'No especificado';
    document.getElementById('viewDentistGradYear').textContent = dentist.anoGraduacion || 'No especificado';
    document.getElementById('viewDentistExperience').textContent = `${dentist.experiencia || 0} años`;

    // Mostrar especialidades como badges
    const specialtiesContainer = document.getElementById('viewDentistSpecialties');
    if (dentist.especialidades) {
        const especialidadesArray = dentist.especialidades.split(', ');
        const specialtyBadges = especialidadesArray.map(especialidad => {
            return `<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 mr-1 mb-1">${especialidad}</span>`;
        }).join('');
        specialtiesContainer.innerHTML = specialtyBadges;
    } else {
        specialtiesContainer.textContent = 'No especificadas';
    }

    // Mostrar días de trabajo como badges
    const workDaysContainer = document.getElementById('viewDentistWorkDays');
    if (dentist.diasTrabajo) {
        const diasArray = dentist.diasTrabajo.split(', ');
        const dayBadges = diasArray.map(dia => {
            return `<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 mr-1 mb-1">${dia}</span>`;
        }).join('');
        workDaysContainer.innerHTML = dayBadges;
    } else {
        workDaysContainer.textContent = 'No especificados';
    }

    // Mostrar horario
    const scheduleElement = document.getElementById('viewDentistSchedule');
    if (dentist.horaInicio && dentist.horaFin) {
        scheduleElement.textContent = `${dentist.horaInicio} - ${dentist.horaFin}`;
    } else {
        scheduleElement.textContent = 'No especificado';
    }

    // Actualizar avatar
    const avatar = document.getElementById('viewDentistAvatar');
    avatar.innerHTML = getDentistProfileImage(dentist.genero);

    // Guardar referencia del odontólogo actual
    DentistsModule.currentDentist = dentist;

    // Mostrar modal
    const modal = document.getElementById('viewDentistModal');
    modal.classList.remove('hidden');

    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Cierra el modal de detalles del odontólogo
 */
function closeViewDentistModal() {
    const modal = document.getElementById('viewDentistModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    DentistsModule.currentDentist = null;
}

/**
 * Editar odontólogo
 */
async function editDentist(dentistId) {
    // Apertura instantánea desde caché (sin loader visible)
    const cached = (DentistsModule.cachedDentists || []).find(o => String(o.id) === String(dentistId));
    if (cached) {
        await openNewDentistModal(cached);
        return;
    }

    try {
        // Respaldo: traer de la API con indicador (solo si no está en caché)
        Swal.fire({
            title: 'Cargando datos del odontólogo...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Obtener datos del odontólogo
        const dentist = await OdontologosAPI.getOdontologoById(dentistId);

        // Cerrar loading
        Swal.close();

        // Abrir modal de nuevo odontólogo en modo edición
        await openNewDentistModal(dentist);

    } catch (error) {
        console.error('Error al cargar odontólogo para edición:', error);
        Swal.close();

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del odontólogo para editar.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Editar odontólogo desde el modal de detalles
 */
function editDentistFromModal() {
    if (DentistsModule.currentDentist) {
        // Reutilizar el objeto en memoria (sin loader ni refetch)
        const dentist = DentistsModule.currentDentist;
        closeViewDentistModal();
        openNewDentistModal(dentist).catch(error => {
            console.error('Error al abrir edición del odontólogo:', error);
        });
    }
}

/**
 * Ver horarios del odontólogo
 */
function viewSchedule(dentistId) {
    console.log('Ver horarios del odontólogo:', dentistId);

    Swal.fire({
        icon: 'info',
        title: 'Abriendo horarios...',
        html: `
            <div class="text-center">
                <i class="fas fa-calendar-alt text-4xl text-blue-500 mb-3"></i>
                <p class="text-gray-600">Abriendo gestión de horarios y disponibilidad del odontólogo.</p>
            </div>
        `,
        timer: 1500,
        confirmButtonColor: '#3b82f6'
    });
}

/**
 * Ver horarios desde el modal
 */
function viewScheduleFromModal() {
    if (DentistsModule.currentDentist) {
        closeViewDentistModal();
        viewSchedule(DentistsModule.currentDentist.id);
    }
}

/**
 * Ver pacientes del odontólogo
 */
function viewPatients(dentistId) {
    console.log('Ver pacientes del odontólogo:', dentistId);

    Swal.fire({
        icon: 'info',
        title: 'Cargando pacientes...',
        html: `
            <div class="text-center">
                <i class="fas fa-users text-4xl text-purple-500 mb-3"></i>
                <p class="text-gray-600">Cargando lista de pacientes asignados al odontólogo.</p>
            </div>
        `,
        timer: 1500,
        confirmButtonColor: '#8b5cf6'
    });
}

/**
 * Cambiar estado del odontólogo
 */
async function toggleDentistStatus(dentistId) {
    // Obtener datos del odontólogo
    const dentist = getSimulatedDentist(dentistId);
    const isActive = dentist.estado === 'activo';
    const newStatus = isActive ? 'inactivo' : 'activo';
    const action = isActive ? 'desactivar' : 'activar';

    const result = await Swal.fire({
        icon: 'question',
        title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} odontólogo?`,
        html: `
            <div class="text-center">
                <div class="mb-4">
                    <div class="w-16 h-16 ${isActive ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-user-md ${isActive ? 'text-red-600' : 'text-green-600'} text-xl"></i>
                    </div>
                    <p class="text-gray-700 mb-2">Dr(a). <strong>${dentist.nombres} ${dentist.apellidos}</strong></p>
                    <p class="text-sm text-gray-500">${dentist.licenciaProfesional}</p>
                </div>
                <div class="bg-${isActive ? 'yellow' : 'blue'}-50 border border-${isActive ? 'yellow' : 'blue'}-200 rounded-lg p-4">
                    <p class="text-${isActive ? 'yellow' : 'blue'}-800 text-sm">
                        <i class="fas fa-info-circle mr-2"></i>
                        ${isActive
                            ? 'Al desactivar al odontólogo, no podrá recibir nuevas citas pero mantendrá las existentes.'
                            : 'Al activar al odontólogo, podrá recibir nuevas citas según su disponibilidad.'}
                    </p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: `Sí, ${action}`,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: isActive ? '#f59e0b' : '#10b981',
        cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
        try {
            // Mostrar progreso
            Swal.fire({
                title: `${action.charAt(0).toUpperCase() + action.slice(1)}ando odontólogo...`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Simular actualización
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Confirmar cambio
            await Swal.fire({
                icon: 'success',
                title: `Odontólogo ${isActive ? 'desactivado' : 'activado'}`,
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">El estado del Dr(a). <strong>${dentist.nombres} ${dentist.apellidos}</strong> ha sido actualizado.</p>
                        <div class="mt-4 p-3 bg-green-50 rounded-lg">
                            <p class="text-sm text-green-700">
                                <i class="fas fa-check-circle mr-1"></i>
                                Estado actual: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#10b981'
            });

            // Recargar lista
            loadDentists();

        } catch (error) {
            console.error('Error al cambiar estado:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al cambiar estado',
                text: 'No se pudo actualizar el estado del odontólogo.',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/**
 * Eliminar odontólogo
 */
async function deleteDentist(dentistId) {
    // Obtener datos del odontólogo
    const dentist = getSimulatedDentist(dentistId);

    const result = await Swal.fire({
        icon: 'warning',
        title: '¿Eliminar odontólogo?',
        html: `
            <div class="text-center">
                <div class="swal-delete-summary">
                    <div class="swal-delete-icon">
                        <i class="fas fa-user-md text-red-600 text-xl"></i>
                    </div>
                    <p class="text-gray-700 mb-2">Dr(a). <strong>${dentist.nombres} ${dentist.apellidos}</strong></p>
                    <p class="text-sm text-gray-500">${dentist.licenciaProfesional}</p>
                </div>
                <div class="swal-delete-warning">
                    <p class="text-red-800 text-sm">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <strong>Advertencia:</strong> Esta acción no se puede deshacer y eliminará:
                    </p>
                    <ul class="text-red-700 text-sm mt-2 text-left list-disc ml-6">
                        <li>Toda la información profesional del odontólogo</li>
                        <li>Su historial de pacientes y tratamientos</li>
                        <li>Todas las citas programadas (se cancelarán)</li>
                        <li>Horarios y disponibilidad configurada</li>
                    </ul>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        customClass: { popup: 'swal-delete-modal' }
    });

    if (result.isConfirmed) {
        try {
            // Mostrar progreso de eliminación
            Swal.fire({
                title: 'Eliminando odontólogo...',
                html: 'Procesando eliminación del odontólogo y cancelando citas pendientes.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Simular eliminación
            await new Promise(resolve => setTimeout(resolve, 2500));

            // Confirmar eliminación
            await Swal.fire({
                icon: 'success',
                title: 'Odontólogo eliminado',
                html: `
                    <div class="text-center">
                        <p class="text-gray-600">El Dr(a). <strong>${dentist.nombres} ${dentist.apellidos}</strong> ha sido eliminado del sistema.</p>
                        <div class="mt-4 p-3 bg-green-50 rounded-lg">
                            <p class="text-sm text-green-700">
                                <i class="fas fa-check-circle mr-1"></i>
                                Todas las citas pendientes han sido canceladas automáticamente
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#10b981'
            });

            // Recargar lista
            loadDentists();

        } catch (error) {
            console.error('Error al eliminar odontólogo:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: 'No se pudo eliminar el odontólogo. Por favor intente nuevamente.',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/**
 * Carga la lista de odontólogos
 */
async function loadDentists() {
    try {
        console.log('👨‍⚕️ Cargando lista de odontólogos...');

        // Obtener datos reales de la API
        const odontologos = await OdontologosAPI.getAllOdontologos();

        // Guardar caché para apertura instantánea de ver/editar (sin loader)
        DentistsModule.cachedDentists = Array.isArray(odontologos) ? odontologos : [];

        // Paginación real del lado cliente
        TablePager.register('odontologos', function (page, pageSize) {
            if (pageSize) DentistsModule.pagination.itemsPerPage = pageSize;
            DentistsModule.pagination.currentPage = page;
            const pg = TablePager.paginate(getFilteredOdontologos(), page, DentistsModule.pagination.itemsPerPage);
            DentistsModule.pagination.currentPage = pg.page;
            updateDentistsTable(pg.rows);
            TablePager.renderBar('odontologosPager', pg, 'odontologos');
        });
        const odontologosPager = TablePager.paginate(getFilteredOdontologos(), DentistsModule.pagination.currentPage, DentistsModule.pagination.itemsPerPage);
        DentistsModule.pagination.currentPage = odontologosPager.page;
        DentistsModule.pagination.totalItems = odontologosPager.total;

        // Actualizar tabla con datos reales
        updateDentistsTable(odontologosPager.rows);
        TablePager.renderBar('odontologosPager', odontologosPager, 'odontologos');

        // Actualizar estadísticas
        updateDentistsStats(odontologos);

        console.log('✅ Odontólogos cargados exitosamente');

    } catch (error) {
        console.error('❌ Error al cargar odontólogos:', error);

        // Mostrar tabla vacía en caso de error
        updateDentistsTable([]);

        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo cargar la lista de odontólogos.',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Configura los filtros
 */
function setupFilters() {
    console.log('🔍 Filtros de odontólogos configurados');
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
function normTxt(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function trabajaHoy(diasTrabajo) {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const hoy = dias[new Date().getDay()];
    return normTxt(diasTrabajo).split(',').map(function (d) { return normTxt(d).trim(); }).includes(hoy);
}

const ESP_LABEL = {
    general: 'odontologia general',
    ortodoncia: 'ortodoncia',
    endodoncia: 'endodoncia',
    periodoncia: 'periodoncia',
    cirugia: 'cirugia',
    protesis: 'protesis',
    pediatrica: 'odontopediatria',
    estetica: 'estetica'
};

function getFilteredOdontologos() {
    const list = DentistsModule.cachedDentists || [];
    const f = DentistsModule.filters || {};
    const q = String(f.search || '').trim().toLowerCase();
    return list.filter(function (o) {
        if (q) {
            const hay = [o.nombre, o.apellido, o.documento, o.matricula, o.especialidades, o.email]
                .map(function (v) { return String(v || '').toLowerCase(); }).join(' | ');
            if (hay.indexOf(q) === -1) return false;
        }
        if (f.especialidad) {
            const label = ESP_LABEL[f.especialidad] || f.especialidad;
            if (normTxt(o.especialidades).indexOf(label) === -1) return false;
        }
        if (f.disponibilidad === 'disponible' && !trabajaHoy(o.diasTrabajo)) return false;
        if (f.disponibilidad === 'no-disponible' && trabajaHoy(o.diasTrabajo)) return false;
        return true;
    });
}

function renderOdontologosFiltrados() {
    const filtered = getFilteredOdontologos();
    const pager = TablePager.paginate(filtered, DentistsModule.pagination.currentPage, DentistsModule.pagination.itemsPerPage);
    DentistsModule.pagination.currentPage = pager.page;
    DentistsModule.pagination.totalItems = pager.total;
    updateDentistsTable(pager.rows);
    TablePager.renderBar('odontologosPager', pager, 'odontologos');
}

function applyFilters() {
    const filtersSection = document.getElementById('filtersSection');

    if (filtersSection) {
        const searchInput = filtersSection.querySelector('input[type="text"]');
        const especialidadSelect = filtersSection.querySelectorAll('select')[0];
        const disponibilidadSelect = filtersSection.querySelectorAll('select')[1];

        DentistsModule.filters = {
            search: searchInput?.value || '',
            especialidad: especialidadSelect?.value || '',
            disponibilidad: disponibilidadSelect?.value || ''
        };

        console.log('🔍 Aplicando filtros:', DentistsModule.filters);

        // Filtrado real sobre la caché (sin recarga ni mensajes simulados)
        DentistsModule.pagination.currentPage = 1;
        renderOdontologosFiltrados();
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

        DentistsModule.filters = {
            search: '',
            especialidad: '',
            disponibilidad: ''
        };

        console.log('🧹 Filtros limpiados');

        DentistsModule.pagination.currentPage = 1;
        renderOdontologosFiltrados();
    }
}

/**
 * Maneja la búsqueda en tiempo real (filtra la caché sin recargar)
 */
function handleSearchInput(e) {
    const query = e.target.value.trim();
    console.log('🔍 Búsqueda en tiempo real:', query);

    DentistsModule.filters.search = query;
    DentistsModule.pagination.currentPage = 1;
    renderOdontologosFiltrados();
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
    console.log('👋 Bienvenido al módulo de odontólogos');
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
 * Obtener iniciales del odontólogo para el avatar
 */
function getDentistInitials(nombres, apellidos) {
    const firstInitial = nombres?.charAt(0)?.toUpperCase() || '';
    const lastInitial = apellidos?.charAt(0)?.toUpperCase() || '';
    return `<span class="text-emerald-600 font-bold text-xl">${firstInitial}${lastInitial}</span>`;
}

/**
 * Obtener datos simulados de un odontólogo
 */
function getSimulatedDentist(dentistId) {
    const dentists = {
        1: {
            id: 1,
            nombres: 'Roberto',
            apellidos: 'Martínez',
            tipoDocumento: 'CC',
            documento: '12345678',
            fechaNacimiento: '1985-03-15',
            genero: 'M',
            email: 'roberto.martinez@clinica.com',
            telefono: '+57 300 123 4567',
            direccion: 'Calle 123 #45-67, Bogotá',
            licenciaProfesional: 'MP-12345',
            universidad: 'Universidad Nacional de Colombia',
            anoGraduacion: 2010,
            experiencia: 14,
            especialidades: ['ortododoncia', 'general'],
            diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
            horaInicio: '08:00',
            horaFin: '17:00',
            estado: 'activo',
            disponibilidad: 'disponible',
            fechaRegistro: '2024-01-15T10:30:00'
        },
        2: {
            id: 2,
            nombres: 'María',
            apellidos: 'López',
            tipoDocumento: 'CC',
            documento: '87654321',
            fechaNacimiento: '1980-08-22',
            genero: 'F',
            email: 'maria.lopez@clinica.com',
            telefono: '+57 301 987 6543',
            direccion: 'Carrera 45 #12-34, Medellín',
            licenciaProfesional: 'MP-67890',
            universidad: 'Universidad Javeriana',
            anoGraduacion: 2005,
            experiencia: 19,
            especialidades: ['endodoncia', 'estetica'],
            diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
            horaInicio: '07:00',
            horaFin: '16:00',
            estado: 'activo',
            disponibilidad: 'ocupado',
            fechaRegistro: '2024-02-01T14:15:00'
        }
    };

    return dentists[dentistId] || dentists[1];
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
 * Actualiza la tabla de odontólogos con los datos del servidor
 */
function updateDentistsTable(odontologos) {
    const tableBody = document.querySelector('#odontologosTable tbody');
    if (!tableBody) return;

    if (odontologos.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    <i class="fas fa-user-md text-4xl mb-3 text-gray-300"></i>
                    <p>No se encontraron odontólogos</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = odontologos.map(odontologo => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        ${getDentistProfileImage(odontologo.genero, 'h-10 w-10')}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                            Dr. ${odontologo.nombre} ${odontologo.apellido}
                        </div>
                        <div class="text-sm text-gray-500">Matrícula: ${odontologo.matricula}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                <div class="text-sm text-gray-900">${odontologo.matricula}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Activo
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                <span class="text-sm text-gray-900">Odontología General</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="sys-table-actions">
                <button onclick="viewDentist(${odontologo.id})" class="sys-table-action sys-table-action-view" title="Ver detalles" aria-label="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editDentist(${odontologo.id})" class="sys-table-action sys-table-action-edit" title="Editar" aria-label="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteDentist(${odontologo.id})" class="sys-table-action sys-table-action-delete" title="Eliminar" aria-label="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Actualiza las estadísticas de odontólogos
 */
function updateDentistsStats(odontologos) {
    const list = Array.isArray(odontologos) ? odontologos : [];
    const normalize = value => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    // Disponibles hoy: su campo diasTrabajo incluye el día actual
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const hoy = dias[new Date().getDay()];
    const disponibles = list.filter(function (o) {
        const diasTrabajo = Array.isArray(o.diasTrabajo) ? o.diasTrabajo : String(o.diasTrabajo || '').split(',');
        return diasTrabajo.map(normalize).includes(hoy);
    }).length;

    // Especialidades distintas reales en el sistema
    const especs = new Set();
    list.forEach(function (o) {
        String(o.especialidades || '').split(',').forEach(function (e) {
            const t = e.trim();
            if (t) especs.add(t.toLowerCase());
        });
    });

    // Conteos reales en el orden de las tarjetas: total, disponibles hoy, especialidades, citas
    const values = [list.length, disponibles, especs.size, null];

    const paint = function (vals) {
        const cards = document.querySelectorAll('.sys-stat-card .sys-stat-value');
        cards.forEach(function (el, i) {
            if (vals[i] !== undefined && vals[i] !== null) el.textContent = Number(vals[i]).toLocaleString();
        });
    };
    paint(values);

    // Citas agendadas reales (conteo del sistema)
    fetch('/api/citas', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (c) {
            values[3] = Array.isArray(c) ? c.length : 0;
            paint(values);
        })
        .catch(function () { /* se conserva el valor inicial */ });
}

/**
 * Obtener imagen de perfil según el género del odontólogo
 */
function getDentistProfileImage(gender, sizeClasses = 'h-full w-full') {
    const normalizedGender = String(gender || '').trim().toUpperCase();
    const imagePath = normalizedGender.startsWith('F')
        ? '/Imagenes/odontologa.png'
        : '/Imagenes/odontologo.png';

    return `<img src="${imagePath}" alt="Perfil del odontólogo" class="${sizeClasses} rounded-full object-cover">`;
}

/**
 * Elimina un odontólogo
 */
async function deleteDentist(dentistId) {
    const result = await Swal.fire({
        title: '¿Eliminar odontólogo?',
        html: '<div class="swal-delete-summary"><div class="swal-delete-icon"><i class="fas fa-user-md"></i></div><strong>Eliminar odontólogo</strong><div class="swal-delete-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Esta acción no se puede deshacer. Se cancelarán las citas pendientes.</div></div>',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'swal-delete-modal' }
    });

    if (result.isConfirmed) {
        try {
            await OdontologosAPI.deleteOdontologo(dentistId);

            await Swal.fire({
                icon: 'success',
                title: 'Odontólogo eliminado',
                text: 'El odontólogo ha sido eliminado exitosamente',
                confirmButtonColor: '#10b981'
            });

            // Recargar lista
            await loadDentists();

        } catch (error) {
            console.error('Error al eliminar odontólogo:', error);

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el odontólogo',
                confirmButtonColor: '#dc2626'
            });
        }
    }
}

/**
 * Actualiza la función closeNewDentistModal para resetear el estado
 */
function closeNewDentistModal() {
    const modal = document.getElementById('newDentistModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    // Resetear modo de edición
    DentistsModule.editMode = false;
    DentistsModule.editingDentistId = null;
}

/**
 * Convierte el código de género a texto legible
 */
function getGenderText(genero) {
    switch(genero) {
        case 'M': return 'Masculino';
        case 'F': return 'Femenino';
        case 'O': return 'Otro';
        default: return 'No especificado';
    }
}

// Exportar funciones principales para uso global
window.DentistsModule = DentistsModule;
window.OdontologosAPI = OdontologosAPI;
window.openNewDentistModal = openNewDentistModal;
window.closeNewDentistModal = closeNewDentistModal;
window.viewDentist = viewDentist;
window.closeViewDentistModal = closeViewDentistModal;
window.editDentist = editDentist;
window.editDentistFromModal = editDentistFromModal;
window.viewSchedule = viewSchedule;
window.viewScheduleFromModal = viewScheduleFromModal;
window.viewPatients = viewPatients;
window.toggleDentistStatus = toggleDentistStatus;
window.deleteDentist = deleteDentist;
window.toggleFilters = toggleFilters;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;

/* Cierre de modales de acción con clic fuera o tecla Escape */
(function () {
    var ACTION_MODALS = [
        { id: 'newDentistModal', close: closeNewDentistModal },
        { id: 'viewDentistModal', close: closeViewDentistModal }
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
