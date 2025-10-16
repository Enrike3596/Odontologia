/**
 * Gestión de modales
 */

/**
 * Abre el modal para agregar un nuevo paciente
 */
function abrirModalUsuario() {
    modalUsuario.classList.remove('hidden');
    setTimeout(() => {
        modalUsuario.querySelector('.bg-white').style.transform = 'scale(1)';
    }, 10);
}

/**
 * Abre el modal para agendar una nueva cita
 */
async function abrirModalCita() {
    await cargarPacientesSelect();
    modalCita.classList.remove('hidden');
    setTimeout(() => {
        modalCita.querySelector('.bg-white').style.transform = 'scale(1)';
    }, 10);
}

/**
 * Abre el modal de cita con un paciente preseleccionado
 * @param {number} pacienteId - ID del paciente a preseleccionar
 */
function abrirModalCitaConPaciente(pacienteId) {
    cargarPacientesSelect().then(() => {
        selectPaciente.value = pacienteId;
        modalCita.classList.remove('hidden');
        setTimeout(() => {
            modalCita.querySelector('.bg-white').style.transform = 'scale(1)';
        }, 10);
    });
}

/**
 * Cierra el modal de usuario
 */
function cerrarModalUsuario() {
    modalUsuario.querySelector('.bg-white').style.transform = 'scale(0.95)';
    setTimeout(() => {
        modalUsuario.classList.add('hidden');
        formUsuario.reset();
    }, 150);
}

/**
 * Cierra el modal de cita
 */
function cerrarModalCita() {
    modalCita.querySelector('.bg-white').style.transform = 'scale(0.95)';
    setTimeout(() => {
        modalCita.classList.add('hidden');
        formCita.reset();
    }, 150);
}

/**
 * Configura los event listeners para los modales
 */
function configurarEventListenersModales() {
    // Botones para abrir modales
    document.getElementById('btn-agregar-usuario').addEventListener('click', abrirModalUsuario);
    document.getElementById('btn-agregar-cita').addEventListener('click', abrirModalCita);

    // Botones para cerrar modal de usuario
    document.getElementById('cerrar-modal-usuario').addEventListener('click', cerrarModalUsuario);
    document.getElementById('cancelar-usuario').addEventListener('click', cerrarModalUsuario);

    // Botones para cerrar modal de cita
    document.getElementById('cerrar-modal-cita').addEventListener('click', cerrarModalCita);
    document.getElementById('cancelar-cita').addEventListener('click', cerrarModalCita);
}