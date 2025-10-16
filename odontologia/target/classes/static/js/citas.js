/**
 * Gestión de citas
 */

/**
 * Carga la lista de citas desde la API
 */
async function cargarCitas() {
    try {
        const response = await fetch('/api/citas');
        if (!response.ok) throw new Error('Error al cargar citas');
        citas = await response.json();
        citasFiltradas = [...citas];
        renderizarCitas();
        renderizarPacientes();
        actualizarEstadisticas();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar citas', 'error');
    }
}

/**
 * Renderiza la lista de citas en el DOM
 */
function renderizarCitas() {
    if (!citasFiltradas || citasFiltradas.length === 0) {
        listaCitas.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No hay citas registradas</p>
            </div>`;
        return;
    }

    listaCitas.innerHTML = citasFiltradas.map(cita => {
        const estadoClass = {
            'PENDIENTE': 'bg-yellow-100 text-yellow-800',
            'CONFIRMADA': 'bg-green-100 text-green-800',
            'CANCELADA': 'bg-red-100 text-red-800'
        }[cita.estado] || 'bg-yellow-100 text-yellow-800';

        const iconoEstado = {
            'PENDIENTE': 'fas fa-clock',
            'CONFIRMADA': 'fas fa-check-circle',
            'CANCELADA': 'fas fa-times-circle'
        }[cita.estado] || 'fas fa-clock';

        return `
            <div class="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div class="flex flex-col md:flex-row md:items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <i class="fas fa-user text-dental-500"></i>
                            <h4 class="text-lg font-semibold text-gray-800">${cita.pacienteNombre || 'Paciente'}</h4>
                            <span class="px-3 py-1 rounded-full text-xs font-medium ${estadoClass}">
                                <i class="${iconoEstado} mr-1"></i>
                                ${cita.estado || 'PENDIENTE'}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div class="flex items-center">
                                <i class="fas fa-calendar text-dental-500 mr-2"></i>
                                ${formatearFecha(cita.fecha)}
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-clock text-dental-500 mr-2"></i>
                                ${cita.hora || '—'}
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-user-md text-dental-500 mr-2"></i>
                                ${cita.odontologo || '—'}
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-2 mt-4 md:mt-0">
                        <select onchange="cambiarEstadoCita(${cita.id}, this.value)" class="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-dental-500">
                            <option value="PENDIENTE" ${cita.estado === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                            <option value="CONFIRMADA" ${cita.estado === 'CONFIRMADA' ? 'selected' : ''}>Confirmada</option>
                            <option value="CANCELADA" ${cita.estado === 'CANCELADA' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                </div>
            </div>`;
    }).join('');
}

/**
 * Cambia el estado de una cita
 * @param {number} citaId - ID de la cita
 * @param {string} nuevoEstado - Nuevo estado de la cita
 */
async function cambiarEstadoCita(citaId, nuevoEstado) {
    try {
        const response = await fetch(`/api/citas/${citaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (response.ok) {
            mostrarToast('Estado actualizado correctamente');
            await cargarCitas();
        } else {
            mostrarToast('Error al actualizar estado', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al actualizar estado', 'error');
    }
}

/**
 * Aplica filtros a la lista de citas
 */
function aplicarFiltrosCitas() {
    const textoBusqueda = filtroBusqueda.value.toLowerCase();
    const estadoSeleccionado = filtroEstado.value;

    citasFiltradas = citas.filter(cita => {
        const coincideTexto = !textoBusqueda ||
            (cita.pacienteNombre || '').toLowerCase().includes(textoBusqueda) ||
            (cita.pacienteDocumento || '').toLowerCase().includes(textoBusqueda);

        const coincideEstado = !estadoSeleccionado || cita.estado === estadoSeleccionado;
        return coincideTexto && coincideEstado;
    });

    renderizarCitas();
}

/**
 * Maneja el envío del formulario de cita
 * @param {Event} e - Evento del formulario
 */
async function manejarFormularioCita(e) {
    e.preventDefault();
    const formData = new FormData(formCita);
    const citaData = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/citas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(citaData)
        });

        if (response.ok) {
            mostrarToast('Cita agendada exitosamente');
            cerrarModalCita();
            await cargarCitas();
        } else {
            mostrarToast('Error al agendar cita', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al agendar cita', 'error');
    }
}

/**
 * Configura los event listeners para citas
 */
function configurarEventListenersCitas() {
    if (formCita) {
        formCita.addEventListener('submit', manejarFormularioCita);
    }
    
    if (filtroBusqueda) {
        filtroBusqueda.addEventListener('input', aplicarFiltrosCitas);
    }
    
    if (filtroEstado) {
        filtroEstado.addEventListener('change', aplicarFiltrosCitas);
    }
}