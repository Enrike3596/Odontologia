/**
 * Catálogos centrales del sistema - única fuente frontend (punto 4).
 * Espejo de los enums backend: TipoDocumento, Genero, Parentesco, EstadoCitaEnum.
 * El tipo de cita NO va aquí: se carga de /api/tipos-cita (tabla administrable).
 * Si el backend expone /api/catalogos, se usa; si falla, se usan estos valores.
 */
(function () {
    'use strict';

    var CATALOGOS_FALLBACK = {
        tiposDocumento: [
            { codigo: 'CC', etiqueta: 'Cédula de Ciudadanía' },
            { codigo: 'CE', etiqueta: 'Cédula de Extranjería' },
            { codigo: 'TI', etiqueta: 'Tarjeta de Identidad' },
            { codigo: 'PP', etiqueta: 'Pasaporte' },
            { codigo: 'PA', etiqueta: 'Pasaporte Andino' },
            { codigo: 'RC', etiqueta: 'Registro Civil' }
        ],
        generos: [
            { codigo: 'M', etiqueta: 'Masculino' },
            { codigo: 'F', etiqueta: 'Femenino' },
            { codigo: 'O', etiqueta: 'Otro' }
        ],
        parentescos: [
            'Padre', 'Madre', 'Esposo', 'Esposa', 'Hijo', 'Hija',
            'Hermano', 'Hermana', 'Abuelo', 'Abuela', 'Tío', 'Tía',
            'Primo', 'Prima', 'Amigo', 'Amiga', 'Tutor legal', 'Otro'
        ]
    };

    var cache = null;

    function getFallback() {
        return JSON.parse(JSON.stringify(CATALOGOS_FALLBACK));
    }

    /**
     * Obtiene los catálogos (con caché en memoria). Siempre resuelve.
     * @returns {Promise<Object>}
     */
    function getCatalogos() {
        if (cache) return Promise.resolve(cache);
        return fetch('/api/catalogos', { headers: { 'Accept': 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                cache = data;
                return cache;
            })
            .catch(function () {
                cache = getFallback();
                return cache;
            });
    }

    /**
     * Llena un <select> con opciones {codigo, etiqueta}.
     * @param {HTMLSelectElement} select
     * @param {Array} opciones
     * @param {string} placeholder
     */
    function fillSelect(select, opciones, placeholder) {
        if (!select) return;
        var actual = select.value;
        select.innerHTML = '';
        if (placeholder) {
            var ph = document.createElement('option');
            ph.value = '';
            ph.textContent = placeholder;
            select.appendChild(ph);
        }
        (opciones || []).forEach(function (op) {
            var o = document.createElement('option');
            o.value = op.codigo;
            o.textContent = op.etiqueta;
            select.appendChild(o);
        });
        if (actual) select.value = actual;
    }

    window.Catalogos = {
        getCatalogos: getCatalogos,
        fillSelect: fillSelect,
        fallback: getFallback
    };
})();
