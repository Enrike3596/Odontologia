/**
 * Utilidades y funciones helper
 */

/**
 * Muestra notificaciones toast usando SweetAlert2
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación ('success' o 'error')
 */
function mostrarToast(mensaje, tipo = 'success') {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: tipo === 'success' ? 'success' : 'error',
        title: mensaje,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: tipo === 'success' ? '#22c55e' : '#ef4444',
        color: '#fff',
        customClass: {
            popup: 'rounded-lg shadow-lg',
            title: 'text-lg font-semibold',
        }
    });
}

/**
 * Formatea una fecha al español
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha) return '—';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Configura la fecha mínima para inputs de fecha (hoy)
 */
function configurarFechaMinima() {
    if (fechaInput) {
        fechaInput.min = new Date().toISOString().split('T')[0];
    }
}

/**
 * Actualiza las estadísticas del dashboard
 */
function actualizarEstadisticas() {
    if (totalPacientesElem) totalPacientesElem.textContent = pacientes.length;
    if (citasPendientesElem) citasPendientesElem.textContent = citas.filter(c => c.estado === 'PENDIENTE').length;
    if (citasConfirmadasElem) citasConfirmadasElem.textContent = citas.filter(c => c.estado === 'CONFIRMADA').length;
}