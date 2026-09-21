/* Guardia de sesion - Clinica Odontologica.
 *
 * La fuente de verdad es la sesion HTTP del lado servidor (GET /api/auth/me).
 * El 'clinica.session' del navegador es solo cache de UI (nombre/rol para
 * pintar el sidebar): nunca es prueba de acceso. Sin sesion valida en el
 * servidor -> guarda la ruta en 'clinica.next' y redirige a /login con
 * location.replace() (no deja la pagina protegida en el historial).
 *
 * Uso:
 *   - Paginas protegidas: <body data-require-auth="true"> + incluir este script.
 *   - Pagina de login: <body data-guest-only="true"> + incluir este script.
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

  function saveSessionCache(data, remember) {
    try {
      var storage = remember ? localStorage : sessionStorage;
      (remember ? sessionStorage : localStorage).removeItem(SESSION_KEY);
      storage.setItem(SESSION_KEY, JSON.stringify({
        id: data.id,
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        username: data.username,
        rol: data.rol ? data.rol.nombre : null,
        ts: Date.now()
      }));
    } catch (e) { /* almacenamiento no disponible: continuar igual */ }
  }

  /**
   * Sesión válida según el servidor. Devuelve el usuario, null si no hay
   * sesión, o la marca 'unknown' si el servidor no responde (para no
   * bloquear la app sin red: se usa la caché local como respaldo).
   */
  async function serverSession() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return 'unknown';
    }
  }

  function consumeNext(defaultTarget) {
    var next = read(sessionStorage, NEXT_KEY);
    try { sessionStorage.removeItem(NEXT_KEY); } catch (e) {}
    // Solo rutas internas para evitar open-redirects
    if (next && next.charAt(0) === '/' && next.indexOf('//') !== 0) return next;
    return defaultTarget;
  }

  function rememberHere() {
    try {
      var here = window.location.pathname + window.location.search;
      if (here !== '/login') sessionStorage.setItem(NEXT_KEY, here);
    } catch (e) {}
  }

  async function requireAuth() {
    const me = await serverSession();
    if (me && me !== 'unknown') {
      // Refrescar la caché de UI con los datos del servidor
      saveSessionCache(me, !!read(localStorage, SESSION_KEY));
      return true;
    }
    if (me === 'unknown' && getSession()) return true; // sin red: respaldo local
    // Recuerda a donde queria ir para volver tras el login
    rememberHere();
    window.location.replace('/login');
    return false;
  }

  async function redirectIfAuthenticated() {
    // Sin rastro de sesión local no hay nada que verificar: se evita la
    // sonda /api/auth/me y su 401 esperado en consola al arrancar.
    if (!getSession()) return false;
    const me = await serverSession();
    if (me && me !== 'unknown') {
      window.location.replace(consumeNext('/dashboard'));
      return true;
    }
    if (me === 'unknown' && getSession()) {
      window.location.replace(consumeNext('/dashboard'));
      return true;
    }
    clearSession(); // sesión expirada en el servidor: soltar la caché local
    return false;
  }

  /** Cierre de sesión: invalida en el servidor y luego limpia + redirige. */
  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) { /* best-effort: igual se limpia local */ }
    clearSession();
    window.location.replace('/login');
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
    saveSessionCache: saveSessionCache,
    serverSession: serverSession,
    requireAuth: requireAuth,
    redirectIfAuthenticated: redirectIfAuthenticated,
    consumeNext: consumeNext,
    logout: logout
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', evaluate);
  } else {
    evaluate();
  }
  // Reevaluar al navegar con atras/adelante (incluye paginas restauradas del bfcache)
  window.addEventListener('pageshow', evaluate);
})();
