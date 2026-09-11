/**
 * Paginación real del lado cliente - Sistema Odontológico
 * Helper compartido por los módulos con tablas informativas
 * (citas, pacientes, odontólogos, historias clínicas, usuarios).
 * Cada módulo registra su callback de re-render y la barra muestra
 * conteos reales ("Mostrando X–Y de N registros").
 */

window.TablePager = (function () {
    'use strict';

    var handlers = {};
    var MIN_PAGE_SIZE = 10;
    var DEFAULT_PAGE_SIZE = 10;

    function toArray(list) {
        return Array.isArray(list) ? list : [];
    }

    function register(id, fn) {
        handlers[id] = fn;
    }

    function paginate(list, page, perPage) {
        var items = toArray(list);
        var requestedSize = perPage && perPage > 0 ? perPage : DEFAULT_PAGE_SIZE;
        var per = Math.max(MIN_PAGE_SIZE, requestedSize);
        var total = items.length;
        var pages = Math.max(1, Math.ceil(total / per));
        var p = Math.min(Math.max(1, parseInt(page, 10) || 1), pages);
        var from = total === 0 ? 0 : (p - 1) * per + 1;
        var to = Math.min(p * per, total);
        return {
            rows: items.slice((p - 1) * per, p * per),
            total: total,
            pages: pages,
            page: p,
            from: from,
            to: to,
            perPage: per
        };
    }

    function pageWindow(pages, current) {
        if (pages <= 7) {
            var all = [];
            for (var i = 1; i <= pages; i++) all.push(i);
            return all;
        }
        var set = [1, current - 1, current, current + 1, pages];
        var nums = set.filter(function (n) { return n >= 1 && n <= pages; });
        nums = nums.filter(function (n, i) { return nums.indexOf(n) === i; });
        nums.sort(function (a, b) { return a - b; });
        var out = [];
        var prev = 0;
        nums.forEach(function (n) {
            if (n - prev > 1) out.push('...');
            out.push(n);
            prev = n;
        });
        return out;
    }

    function escAttr(value) {
        return String(value).replace(/"/g, '&quot;');
    }

    function renderBar(containerId, pager, id) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var sizeSelect = container.querySelector('[data-pager-size]');
        if (sizeSelect) {
            sizeSelect.value = String(pager.perPage);
            sizeSelect.onchange = function () {
                setPageSize(id, this.value);
            };
        }

        var info = container.querySelector('[data-pager-info]');
        if (info) {
            info.textContent = pager.total === 0
                ? 'Sin registros'
                : 'Mostrando ' + pager.from + '–' + pager.to + ' de ' + pager.total + ' registros';
        }

        var badge = document.querySelector('[data-table-count="' + id + '"]');
        if (badge) badge.textContent = pager.total;

        var btns = container.querySelector('[data-pager-btns]');
        if (!btns) return;

        if (pager.pages <= 1) {
            btns.innerHTML = '';
            return;
        }

        var html = '';
        html += '<button type="button" class="sys-page-btn" aria-label="Anterior" ' +
            (pager.page <= 1 ? 'disabled' : 'onclick="TablePager.goToPage(\'' + escAttr(id) + '\',' + (pager.page - 1) + ')"') +
            '><i class="fas fa-chevron-left"></i></button>';

        pageWindow(pager.pages, pager.page).forEach(function (n) {
            if (n === '...') {
                html += '<span class="sys-page-dots">...</span>';
            } else {
                html += '<button type="button" class="sys-page-btn' + (n === pager.page ? ' sys-page-btn-active' : '') + '" ' +
                    'onclick="TablePager.goToPage(\'' + escAttr(id) + '\',' + n + ')">' + n + '</button>';
            }
        });

        html += '<button type="button" class="sys-page-btn" aria-label="Siguiente" ' +
            (pager.page >= pager.pages ? 'disabled' : 'onclick="TablePager.goToPage(\'' + escAttr(id) + '\',' + (pager.page + 1) + ')"') +
            '><i class="fas fa-chevron-right"></i></button>';

        btns.innerHTML = html;
    }

    function setPageSize(id, size) {
        var requestedSize = parseInt(size, 10);
        var pageSize = Math.max(MIN_PAGE_SIZE, requestedSize || DEFAULT_PAGE_SIZE);
        var fn = handlers[id];
        if (typeof fn === 'function') fn(1, pageSize);
    }

    function goToPage(id, page) {
        var fn = handlers[id];
        if (typeof fn === 'function') fn(page);
    }

    return {
        MIN_PAGE_SIZE: MIN_PAGE_SIZE,
        DEFAULT_PAGE_SIZE: DEFAULT_PAGE_SIZE,
        register: register,
        paginate: paginate,
        renderBar: renderBar,
        setPageSize: setPageSize,
        goToPage: goToPage
    };
})();
