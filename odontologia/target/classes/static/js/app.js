/**
 * Archivo principal de inicialización
 */

/**
 * Inicializa la aplicación
 */
async function inicializarApp() {
    // Configurar elementos de fecha
    configurarFechaMinima();
    
    // Configurar event listeners
    configurarEventListenersModales();
    configurarEventListenersPacientes();
    configurarEventListenersCitas();
    
    // Cargar datos iniciales
    await cargarPacientes();
    await cargarCitas();
}

/**
 * Funciones que necesitan estar disponibles globalmente
 */
function exponerFuncionesGlobales() {
    window.cambiarEstadoCita = cambiarEstadoCita;
    window.abrirModalCitaConPaciente = abrirModalCitaConPaciente;
}

/**
 * Event listener para el DOM cargado
 */
document.addEventListener('DOMContentLoaded', () => {
    exponerFuncionesGlobales();
    inicializarApp();
});