/**
 * Usuario de sesión - Sistema Odontológico
 * Muestra el nombre, rol y email del usuario logueado en el sidebar y en el
 * menú desplegable del topbar (donde solo se ve el avatar).
 * Sin peticiones extra: usa la sesión guardada por el login (clinica.session).
 */

(function () {
    'use strict';

    function getSession() {
        try {
            if (window.ClinicaAuth && typeof window.ClinicaAuth.getSession === 'function') {
                return window.ClinicaAuth.getSession();
            }
        } catch (e) { /* sesión no accesible */ }
        return null;
    }

    function mapRole(raw) {
        if (raw === null || raw === undefined || raw === '') return 'Usuario';
        var t = String(raw).toLowerCase();
        if (t.indexOf('admin') !== -1) return 'Administrador';
        if (t.indexOf('odont') !== -1 || t.indexOf('doctor') !== -1) return 'Odontólogo';
        if (t.indexOf('recep') !== -1) return 'Recepcionista';
        if (t.indexOf('pacient') !== -1) return 'Paciente';
        return String(raw);
    }

    function currentUser() {
        var s = getSession();
        if (!s) return { name: 'Usuario', email: '', role: 'Sin rol' };
        var name = ((s.nombres || '') + ' ' + (s.apellidos || '')).trim();
        if (!name) name = s.username || s.email || 'Usuario';
        return { name: name, email: s.email || '', role: mapRole(s.rol) };
    }

    function setAll(selector, value) {
        var nodes = document.querySelectorAll(selector);
        nodes.forEach(function (el) { el.textContent = value; });
    }

    function paintSessionUser() {
        if (!document.querySelector('[data-su="name"]')) return;
        var u = currentUser();
        setAll('[data-su="name"]', u.name);
        setAll('[data-su="email"]', u.email);
        setAll('[data-su="role"]', u.role);
        // Sin email, ocultar la línea para no dejar huecos
        document.querySelectorAll('[data-su="email"]').forEach(function (el) {
            el.style.display = u.email ? '' : 'none';
        });
    }

    function closeAllMenus() {
        document.querySelectorAll('.topbar-user.open').forEach(function (el) {
            el.classList.remove('open');
            var btn = el.querySelector('.topbar-avatar-btn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });
    }

    function toggleUserMenu(event) {
        if (event) event.stopPropagation();
        var container = document.querySelector('.topbar-user');
        if (!container) return;
        var willOpen = !container.classList.contains('open');
        closeAllMenus();
        container.classList.toggle('open', willOpen);
        var btn = container.querySelector('.topbar-avatar-btn');
        if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    // Cerrar al hacer clic fuera o con Escape
    document.addEventListener('click', function (event) {
        document.querySelectorAll('.topbar-user.open').forEach(function (el) {
            if (!el.contains(event.target)) {
                el.classList.remove('open');
                var btn = el.querySelector('.topbar-avatar-btn');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeAllMenus();
    });

    // El script carga al final del body: pintar de inmediato y como respaldo en DOMContentLoaded
    paintSessionUser();
    document.addEventListener('DOMContentLoaded', paintSessionUser);

    window.toggleUserMenu = toggleUserMenu;
    window.paintSessionUser = paintSessionUser;
})();
