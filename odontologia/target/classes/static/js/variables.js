/**
 * Variables globales y elementos DOM
 */

// Variables globales de datos
let pacientes = [];
let citas = [];
let citasFiltradas = [];

// Elementos DOM principales
const modalUsuario = document.getElementById('modal-usuario');
const modalCita = document.getElementById('modal-cita');
const formUsuario = document.getElementById('form-usuario');
const formCita = document.getElementById('form-cita');
const listaCitas = document.getElementById('lista-citas');
const filtroBusqueda = document.getElementById('filtro-busqueda');
const filtroEstado = document.getElementById('filtro-estado');
const selectPaciente = document.getElementById('paciente_id');
const listaPacientes = document.getElementById('lista-pacientes');
const filtroPacientes = document.getElementById('filtro-pacientes');

// Elementos de estadísticas
const totalPacientesElem = document.getElementById('total-pacientes');
const citasPendientesElem = document.getElementById('citas-pendientes');
const citasConfirmadasElem = document.getElementById('citas-confirmadas');

// Campo de fecha
const fechaInput = document.getElementById('fecha');