/* Guardia de sesion - Clinica Odontologica.
 *
 * Uso:
 *   - Paginas protegidas: <body data-require-auth="true"> + incluir este script.
 *     Sin sesion -> guarda la ruta en 'clinica.next' y redirige a /login con
 *     location.replace() (no deja la pagina protegida en el historial).
 *   - Pagina de login: <body data-guest-only="true"> + incluir este script.
 *     Con sesion -> redirige a la ruta guardada o /dashboard, tambien con replace
 *     (el boton "atras" ya no devuelve al login).
 *   - Escucha 'pageshow' para reevaluar al volver con atras/adelante,
 *     incluso si la pagina viene del bfcache del navegador.
 */

(function () {
  'use strict';

  var SESSION_KEY = 'clinica.session';
  var NEXT_KEY = 'clinica.next';

  function read(store, key) {
    try {
      return store.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function getSession() {
    var raw = read(localStorage, SESSION_KEY);
    if (raw == null) raw = read(sessionStorage, SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function consumeNext(defaultTarget) {
    var next = read(sessionStorage, NEXT_KEY);
    try { sessionStorage.removeItem(NEXT_KEY); } catch (e) {}
    // Solo rutas internas para evitar open-redirects
    if (next && next.charAt(0) === '/' && next.indexOf('//') !== 0) return next;
    return defaultTarget;
  }

  function requireAuth() {
    if (getSession()) return true;
    // Recuerda a donde queria ir para volver tras el login
    try {
      var here = window.location.pathname + window.location.search;
      if (here !== '/login') sessionStorage.setItem(NEXT_KEY, here);
    } catch (e) {}
    window.location.replace('/login');
    return false;
  }

  function redirectIfAuthenticated() {
    if (!getSession()) return false;
    window.location.replace(consumeNext('/dashboard'));
    return true;
  }

  function evaluate() {
    var body = document.body;
    if (!body) return;
    if (body.hasAttribute('data-require-auth')) {
      requireAuth();
    } else if (body.hasAttribute('data-guest-only')) {
      redirectIfAuthenticated();
    }
  }

  // Exponer API para login.js / botones de logout
  window.ClinicaAuth = {
    getSession: getSession,
    clearSession: clearSession,
    requireAuth: requireAuth,
    redirectIfAuthenticated: redirectIfAuthenticated,
    consumeNext: consumeNext
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', evaluate);
  } else {
    evaluate();
  }
  // Reevaluar al navegar con atras/adelante (incluye paginas restauradas del bfcache)
  window.addEventListener('pageshow', evaluate);
})();
