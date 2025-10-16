/**
 * Gestión de pacientes
 */

/**
 * Carga la lista de pacientes desde la API
 */
async function cargarPacientes() {
    try {
        const response = await fetch('/api/pacientes');
        if (!response.ok) throw new Error('Error al cargar pacientes');
        pacientes = await response.json();
        renderizarPacientes();
        actualizarEstadisticas();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar pacientes', 'error');
    }
}

/**
 * Renderiza la lista de pacientes en el DOM
 * @param {Array} lista - Lista de pacientes a renderizar (opcional, usa la lista global por defecto)
 */
function renderizarPacientes(lista = pacientes) {
    if (!lista || lista.length === 0) {
        listaPacientes.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-user-slash text-4xl mb-3"></i>
                <p>No hay pacientes registrados</p>
            </div>`;
        return;
    }

    listaPacientes.innerHTML = lista.map(paciente => {
        const citaPendiente = citas.find(c => c.pacienteId == paciente.id && c.estado === 'PENDIENTE');
        const botonCita = citaPendiente
            ? `<span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                   <i class="fas fa-clock mr-1"></i> Cita pendiente
               </span>`
            : `<button onclick="abrirModalCitaConPaciente(${paciente.id})" class="bg-dental-500 hover:bg-dental-600 text-white px-3 py-1 rounded-lg text-sm shadow">
                   <i class="fas fa-calendar-plus mr-1"></i> Agendar cita
               </button>`;

        return `
            <div class="flex items-center justify-between py-4 px-2 hover:bg-gray-50 transition">
                <div>
                    <p class="font-semibold text-gray-800">${paciente.nombre}</p>
                    <p class="text-sm text-gray-600">Documento: ${paciente.documento}</p>
                    <p class="text-sm text-gray-600">Tel: ${paciente.telefono || '—'} | ${paciente.correo || '—'}</p>
                </div>
                ${botonCita}
            </div>`;
    }).join('');
}

/**
 * Carga la lista de pacientes en el select del modal de citas
 */
async function cargarPacientesSelect() {
    if (!selectPaciente) return;
    selectPaciente.innerHTML = '<option value="">Seleccione un paciente...</option>';
    if (!pacientes || pacientes.length === 0) await cargarPacientes();

    pacientes.forEach(paciente => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.textContent = `${paciente.nombre} (${paciente.documento || '—'})`;
        selectPaciente.appendChild(option);
    });
}

/**
 * Aplica filtros a la lista de pacientes
 */
function aplicarFiltroPacientes() {
    const textoBusqueda = filtroPacientes.value.toLowerCase();
    const pacientesFiltrados = pacientes.filter(paciente => {
        return !textoBusqueda ||
            paciente.nombre.toLowerCase().includes(textoBusqueda) ||
            paciente.documento.toLowerCase().includes(textoBusqueda);
    });
    renderizarPacientes(pacientesFiltrados);
}

/**
 * Maneja el envío del formulario de paciente
 * @param {Event} e - Evento del formulario
 */
async function manejarFormularioPaciente(e) {
    e.preventDefault();
    const formData = new FormData(formUsuario);
    const pacienteData = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/pacientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pacienteData)
        });

        if (response.ok) {
            mostrarToast('Paciente registrado exitosamente');
            cerrarModalUsuario();
            await cargarPacientes();
        } else {
            mostrarToast('Error al registrar paciente', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al registrar paciente', 'error');
    }
}

/**
 * Configura los event listeners para pacientes
 */
function configurarEventListenersPacientes() {
    if (formUsuario) {
        formUsuario.addEventListener('submit', manejarFormularioPaciente);
    }
    
    if (filtroPacientes) {
        filtroPacientes.addEventListener('input', aplicarFiltroPacientes);
    }
}