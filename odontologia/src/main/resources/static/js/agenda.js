/**
 * Agenda mensual del odontólogo - apertura/cierre (punto 1 del plan).
 * Solo rol Administrador (guard en esta página + enlaces ocultos
 * en el resto de módulos vía [data-require-admin]).
 */

(function () {
    'use strict';

    var state = {
        odontologoId: '',
        anio: null,
        mes: null,
        dias: []
    };

    function isAdmin() {
        try {
            var raw = localStorage.getItem('clinica.session') || sessionStorage.getItem('clinica.session');
            if (!raw) return false;
            var s = JSON.parse(raw);
            return String(s.rol || '').toLowerCase().indexOf('admin') !== -1;
        } catch (e) {
            return false;
        }
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function mesKey() {
        return state.anio + '-' + pad(state.mes);
    }

    function setMes(anio, mes) {
        state.anio = anio;
        state.mes = mes;
        var input = document.getElementById('agendaMes');
        if (input) input.value = mesKey();
        cargarAgenda();
    }

    function init() {
        if (document.body.dataset.page !== 'agenda') return;

        // Guardia: solo Administrador
        if (!isAdmin()) {
            Swal.fire({
                icon: 'warning',
                title: 'Acceso restringido',
                text: 'La agenda médica solo está disponible para el rol Administrador.',
                confirmButtonColor: '#f59e0b'
            }).then(function () {
                window.location.replace('/dashboard');
            });
            return;
        }

        var hoy = new Date();
        state.anio = hoy.getFullYear();
        state.mes = hoy.getMonth() + 1;

        var mesInput = document.getElementById('agendaMes');
        if (mesInput) {
            mesInput.value = mesKey();
            mesInput.addEventListener('change', function () {
                var partes = (mesInput.value || '').split('-');
                if (partes.length === 2) {
                    state.anio = parseInt(partes[0], 10);
                    state.mes = parseInt(partes[1], 10);
                    cargarAgenda();
                }
            });
        }

        var odoSelect = document.getElementById('agendaOdontologo');
        if (odoSelect) {
            odoSelect.addEventListener('change', function () {
                state.odontologoId = odoSelect.value;
                cargarAgenda();
            });
        }

        var form = document.getElementById('movimientoForm');
        if (form) form.addEventListener('submit', guardarMovimiento);

        cargarOdontologos();
    }

    function cargarOdontologos() {
        fetch('/api/odontologos', { headers: { 'Accept': 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (list) {
                var sel = document.getElementById('agendaOdontologo');
                if (!sel) return;
                sel.innerHTML = '<option value="">Seleccionar odontólogo...</option>';
                (list || []).forEach(function (o) {
                    var op = document.createElement('option');
                    op.value = o.id;
                    op.textContent = 'Dr. ' + ((o.nombre || '') + ' ' + (o.apellido || '')).trim();
                    sel.appendChild(op);
                });
            })
            .catch(function () {
                var sel = document.getElementById('agendaOdontologo');
                if (sel) sel.innerHTML = '<option value="">Error al cargar odontólogos</option>';
            });
    }

    function cargarAgenda() {
        if (!state.odontologoId) {
            pintarPlaceholder();
            return;
        }
        var grid = document.getElementById('agendaGrid');
        if (grid) {
            grid.innerHTML = '<div class="col-span-7 text-center py-8 text-gray-500">'
                + '<i class="fas fa-spinner fa-spin text-3xl mb-3"></i><p>Cargando agenda...</p></div>';
        }
        fetch('/api/agenda?odontologoId=' + state.odontologoId + '&anio=' + state.anio + '&mes=' + state.mes,
            { headers: { 'Accept': 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (dias) {
                state.dias = Array.isArray(dias) ? dias : [];
                pintarCalendario();
                pintarResumen();
                cargarMovimientos();
            })
            .catch(function (err) {
                console.error('Error al cargar agenda:', err);
                if (grid) {
                    grid.innerHTML = '<div class="col-span-7 text-center py-8 text-red-500">'
                        + '<i class="fas fa-exclamation-triangle text-3xl mb-3"></i>'
                        + '<p>No se pudo cargar la agenda.</p></div>';
                }
            });
    }

    function pintarPlaceholder() {
        var grid = document.getElementById('agendaGrid');
        if (grid) {
            grid.innerHTML = '<div class="col-span-7 text-center py-8 text-gray-500">'
                + '<i class="fas fa-calendar-days text-3xl mb-3"></i>'
                + '<p>Seleccione un odontólogo para ver su agenda del mes.</p></div>';
        }
        var titulo = document.getElementById('agendaTitulo');
        if (titulo) titulo.textContent = 'Agenda';
    }

    function resumenDia(d) {
        var libres = 0, ocupados = 0, bloqueados = 0;
        (d.turnos || []).forEach(function (t) {
            if (t.estado === 'LIBRE') libres++;
            else if (t.estado === 'OCUPADO') ocupados++;
            else if (t.estado === 'BLOQUEADO') bloqueados++;
        });
        return { libres: libres, ocupados: ocupados, bloqueados: bloqueados };
    }

    function pintarCalendario() {
        var grid = document.getElementById('agendaGrid');
        if (!grid) return;
        var titulo = document.getElementById('agendaTitulo');

        var nombresMes = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        if (titulo) titulo.textContent = 'Agenda · ' + nombresMes[state.mes] + ' ' + state.anio;

        if (!state.dias.length) {
            grid.innerHTML = '<div class="col-span-7 text-center py-8 text-gray-500">Sin datos para este mes.</div>';
            return;
        }

        // Offset lunes=0 para alinear la primera semana
        var primera = new Date(state.dias[0].fecha + 'T12:00:00');
        var offset = (primera.getDay() + 6) % 7;

        var html = '';
        for (var i = 0; i < offset; i++) {
            html += '<div class="agenda-day agenda-day-off"></div>';
        }
        state.dias.forEach(function (d, idx) {
            var r = resumenDia(d);
            var num = parseInt(d.fecha.slice(8, 10), 10);
            var pill;
            if (!d.laborable || !(d.turnos || []).length) {
                pill = '<span class="agenda-pill agenda-nolab">No laborable</span>';
            } else if (r.libres > 0) {
                pill = '<span class="agenda-pill agenda-libre">' + r.libres + ' libres</span>';
            } else if (r.bloqueados > 0 && r.ocupados === 0) {
                pill = '<span class="agenda-pill agenda-bloqueado">Cerrado</span>';
            } else {
                pill = '<span class="agenda-pill agenda-ocupado">' + r.ocupados + ' ocupados</span>';
            }
            html += '<div class="agenda-day" onclick="verDiaAgenda(' + idx + ')" role="button" tabindex="0">'
                + '<div class="agenda-day-num">' + num + '</div>' + pill + '</div>';
        });
        grid.innerHTML = html;
    }

    function pintarResumen() {
        var t = 0, l = 0, o = 0, b = 0;
        state.dias.forEach(function (d) {
            (d.turnos || []).forEach(function (s) {
                t++;
                if (s.estado === 'LIBRE') l++;
                else if (s.estado === 'OCUPADO') o++;
                else if (s.estado === 'BLOQUEADO') b++;
            });
        });
        var set = function (id, v) {
            var el = document.getElementById(id);
            if (el) el.textContent = v;
        };
        set('resTurnos', t);
        set('resLibres', l);
        set('resOcupados', o);
        set('resBloqueados', b);
    }

    function cargarMovimientos() {
        var desde = state.anio + '-' + pad(state.mes) + '-01';
        var ultimo = new Date(state.anio, state.mes, 0).getDate();
        var hasta = state.anio + '-' + pad(state.mes) + '-' + pad(ultimo);
        fetch('/api/agenda/movimientos?odontologoId=' + state.odontologoId + '&desde=' + desde + '&hasta=' + hasta,
            { headers: { 'Accept': 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(pintarMovimientos)
            .catch(function () { pintarMovimientos([]); });
    }

    function pintarMovimientos(list) {
        var body = document.getElementById('movimientosBody');
        if (!body) return;
        if (!list || !list.length) {
            body.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-gray-500">Sin movimientos registrados.</td></tr>';
            return;
        }
        body.innerHTML = list.map(function (m) {
            var tipo = m.tipo === 'APERTURA_EXTRA'
                ? '<span class="agenda-pill agenda-libre">Apertura extra</span>'
                : '<span class="agenda-pill agenda-bloqueado">Cierre</span>';
            var horario = (m.horaInicio && m.horaFin) ? (m.horaInicio.slice(0, 5) + ' - ' + m.horaFin.slice(0, 5)) : 'Día completo';
            return '<tr>'
                + '<td class="px-4 py-3 text-sm text-gray-900">' + (m.fecha || '-') + '</td>'
                + '<td class="px-4 py-3">' + tipo + '</td>'
                + '<td class="px-4 py-3 text-sm text-gray-900">' + horario + '</td>'
                + '<td class="px-4 py-3 text-sm text-gray-600">' + (m.motivo || '-') + '</td>'
                + '<td class="px-4 py-3 text-right text-sm font-medium"><div class="sys-table-actions">'
                + '<button class="sys-table-action sys-table-action-delete" onclick="eliminarMovimiento(' + m.id + ')" title="Eliminar" aria-label="Eliminar">'
                + '<i class="fas fa-trash"></i></button>'
                + '</div></td></tr>';
        }).join('');
    }

    function verDiaAgenda(idx) {
        var d = state.dias[idx];
        if (!d) return;
        var titulo = document.getElementById('agendaDiaTitulo');
        if (titulo) titulo.textContent = 'Agenda · ' + d.fecha + ' (' + (d.diaSemana || '') + ')';
        var box = document.getElementById('agendaDiaTurnos');
        if (box) {
            if (!(d.turnos || []).length) {
                box.innerHTML = '<p class="col-span-full text-sm text-gray-500">Día no laborable o sin turnos. Use Apertura extra para habilitar.</p>';
            } else {
                box.innerHTML = d.turnos.map(function (t) {
                    var cls = t.estado === 'LIBRE' ? 'agenda-libre' : (t.estado === 'OCUPADO' ? 'agenda-ocupado' : 'agenda-bloqueado');
                    return '<div class="agenda-pill ' + cls + ' justify-center">' + t.hora.slice(0, 5) + ' · ' + t.estado + '</div>';
                }).join('');
            }
        }
        var modal = document.getElementById('agendaDiaModal');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(function () { modal.classList.add('show'); }, 10);
        }
    }

    function closeAgendaDiaModal() {
        var modal = document.getElementById('agendaDiaModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(function () { modal.classList.add('hidden'); }, 300);
        }
    }

    function openMovimientoModal(fechaPreset) {
        var modal = document.getElementById('movimientoModal');
        var form = document.getElementById('movimientoForm');
        if (!modal || !form) return;
        form.reset();
        // Pre-cargar odontólogo y fecha del contexto actual
        if (fechaPreset) document.getElementById('movFecha').value = fechaPreset;
        modal.classList.remove('hidden');
        setTimeout(function () { modal.classList.add('show'); }, 10);
    }

    function closeMovimientoModal() {
        var modal = document.getElementById('movimientoModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(function () { modal.classList.add('hidden'); }, 300);
        }
    }

    function guardarMovimiento(e) {
        e.preventDefault();
        if (!state.odontologoId) {
            Swal.fire({ icon: 'warning', title: 'Seleccione un odontólogo', confirmButtonColor: '#f59e0b' });
            return;
        }
        var payload = {
            odontologoId: parseInt(state.odontologoId, 10),
            fecha: document.getElementById('movFecha').value,
            tipo: document.getElementById('movTipo').value,
            horaInicio: document.getElementById('movHoraInicio').value || null,
            horaFin: document.getElementById('movHoraFin').value || null,
            motivo: document.getElementById('movMotivo').value.trim()
        };
        if (!payload.fecha || !payload.motivo) {
            Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Fecha y motivo son requeridos.', confirmButtonColor: '#f59e0b' });
            return;
        }
        fetch('/api/agenda/movimientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (r) {
                if (!r.ok) return r.text().then(function (t) { throw new Error(t || ('HTTP ' + r.status)); });
                return r.json();
            })
            .then(function () {
                closeMovimientoModal();
                Swal.fire({ icon: 'success', title: 'Movimiento guardado', timer: 1800, showConfirmButton: false });
                cargarAgenda();
            })
            .catch(function (err) {
                Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: err.message, confirmButtonColor: '#dc2626' });
            });
    }

    function eliminarMovimiento(id) {
        Swal.fire({
            title: '¿Eliminar movimiento?',
            text: 'La agenda del día volverá a su horario base.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        }).then(function (res) {
            if (!res.isConfirmed) return;
            fetch('/api/agenda/movimientos/' + id, { method: 'DELETE' })
                .then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    cargarAgenda();
                })
                .catch(function () {
                    Swal.fire({ icon: 'error', title: 'No se pudo eliminar', confirmButtonColor: '#dc2626' });
                });
        });
    }

    function agendaMesAnterior() {
        var m = state.mes - 1, a = state.anio;
        if (m < 1) { m = 12; a--; }
        setMes(a, m);
    }

    function agendaMesSiguiente() {
        var m = state.mes + 1, a = state.anio;
        if (m > 12) { m = 1; a++; }
        setMes(a, m);
    }

    function agendaMesActual() {
        var hoy = new Date();
        setMes(hoy.getFullYear(), hoy.getMonth() + 1);
    }

    function irACitas() {
        window.location.href = '/citas';
    }

    document.addEventListener('DOMContentLoaded', init);

    window.verDiaAgenda = verDiaAgenda;
    window.closeAgendaDiaModal = closeAgendaDiaModal;
    window.openMovimientoModal = openMovimientoModal;
    window.closeMovimientoModal = closeMovimientoModal;
    window.eliminarMovimiento = eliminarMovimiento;
    window.agendaMesAnterior = agendaMesAnterior;
    window.agendaMesSiguiente = agendaMesSiguiente;
    window.agendaMesActual = agendaMesActual;
    window.irACitas = irACitas;
})();
