/**
 * Sidebar colapsable - Sistema Odontológico
 * Permite encoger el sidebar a modo iconos y volver a su tamaño normal.
 * El estado se conserva en localStorage y solo aplica en desktop
 * (en móvil el sidebar funciona como drawer y no colapsa).
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'clinica.sidebar.collapsed';
    var MOBILE_BREAKPOINT = 768;

    function getSidebar() {
        return document.getElementById('sidebar');
    }

    function isMobileView() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function readStoredState() {
        try {
            return localStorage.getItem(STORAGE_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function storeState(collapsed) {
        try {
            localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
        } catch (e) {
            /* almacenamiento no disponible: se continúa sin persistencia */
        }
    }

    function updateCollapseButton(sidebar, collapsed) {
        var btn = sidebar.querySelector('.sidebar-collapse-btn');
        if (!btn) return;
        var icon = btn.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-chevron-left', !collapsed);
            icon.classList.toggle('fa-chevron-right', collapsed);
        }
        var label = collapsed ? 'Expandir menú' : 'Colapsar menú';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
    }

    function updateLinkTooltips(sidebar, collapsed) {
        var links = sidebar.querySelectorAll('.sidebar-nav a');
        links.forEach(function (link) {
            if (collapsed) {
                if (link.getAttribute('data-orig-title') === null) {
                    link.setAttribute('data-orig-title', link.getAttribute('title') || '');
                }
                var text = (link.textContent || '').trim().replace(/\s+/g, ' ');
                if (text) link.setAttribute('title', text);
            } else if (link.getAttribute('data-orig-title') !== null) {
                link.setAttribute('title', link.getAttribute('data-orig-title'));
                link.removeAttribute('data-orig-title');
            }
        });
    }

    function applyCollapse(collapsed) {
        var sidebar = getSidebar();
        if (!sidebar) return;
        sidebar.classList.toggle('collapsed', collapsed);
        // Mantener sincronizada la clase pre-pintado del <html>
        try { document.documentElement.classList.toggle('sidebar-collapsed', collapsed); } catch (e) {}
        updateCollapseButton(sidebar, collapsed);
        updateLinkTooltips(sidebar, collapsed);
    }

    function toggleSidebarCollapse() {
        if (isMobileView()) return; // en móvil el sidebar es drawer, no colapsa
        var sidebar = getSidebar();
        if (!sidebar) return;
        var collapsed = !sidebar.classList.contains('collapsed');
        storeState(collapsed);
        applyCollapse(collapsed);
    }

    function initSidebarCollapse() {
        if (isMobileView()) return;
        if (readStoredState()) applyCollapse(true);
    }

    // Aplicar de inmediato (este script carga al final del body, cuando
    // #sidebar ya existe): así el sidebar nace con su tamaño correcto y no
    // hay brinco del sidebar ni del contenido en cada navegación.
    // Se conserva el listener como respaldo por si el script se mueve al head.
    initSidebarCollapse();
    document.addEventListener('DOMContentLoaded', initSidebarCollapse);

    window.addEventListener('resize', function () {
        var sidebar = getSidebar();
        if (!sidebar) return;
        if (isMobileView()) {
            sidebar.classList.remove('collapsed');
            try { document.documentElement.classList.remove('sidebar-collapsed'); } catch (e) {}
        } else {
            applyCollapse(readStoredState());
        }
    });

    window.toggleSidebarCollapse = toggleSidebarCollapse;
})();
