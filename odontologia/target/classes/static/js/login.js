/* Login - Clinica Odontologica.
 * Sin selector de tipo de usuario: el backend resuelve el rol tras validar credenciales.
 * Conectado al backend: POST /api/auth/login (AuthRestController -> UsuarioService.autenticar).
 */

const TAB_ACTIVE = 'flex-1 py-2.5 px-4 rounded-full text-[13px] leading-[18px] tracking-[0.015em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-surface-container-lowest text-primary shadow-sm';
const TAB_INACTIVE = 'flex-1 py-2.5 px-4 rounded-full text-[13px] leading-[18px] tracking-[0.015em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-on-surface-variant hover:text-on-surface';

const LOGIN_BTN_DEFAULT = '<span>Acceder al Portal Odontológico</span><span class="material-symbols-outlined text-[20px]">arrow_forward</span>';
const LOGIN_BTN_LOADING = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Verificando ficha clínica...</span>';
const RECOVERY_BTN_DEFAULT = '<span class="material-symbols-outlined text-[20px]">send</span><span>Enviar código de recuperación</span>';
const RECOVERY_BTN_LOADING = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Enviando código...</span>';
const RESET_BTN_DEFAULT = '<span class="material-symbols-outlined text-[20px]">lock_reset</span><span>Restablecer contraseña</span>';
const RESET_BTN_LOADING = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Restableciendo...</span>';

// Política de contraseñas (reflejo de UsuarioServiceImpl): mín. 10 con mayúscula, minúscula y número
function cumplePoliticaPassword(pwd) {
  if (!pwd || pwd.length < 10) return 'La contraseña debe tener al menos 10 caracteres.';
  if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    return 'La contraseña debe incluir mayúscula, minúscula y número.';
  }
  return null;
}

// Cambio de vista Login <-> Recuperacion
function switchAuthView(targetView) {
  const loginView = document.getElementById('view-login');
  const recoveryView = document.getElementById('view-recovery');
  const tabLogin = document.getElementById('tab-login');
  const tabRecovery = document.getElementById('tab-recovery');
  const banner = document.getElementById('feedback-banner');

  if (banner) {
    banner.classList.add('hidden');
    banner.classList.remove('flex');
  }

  if (targetView === 'login') {
    loginView.classList.remove('hidden');
    recoveryView.classList.add('hidden');
    recoveryView.classList.remove('flex');
    tabLogin.className = TAB_ACTIVE;
    tabRecovery.className = TAB_INACTIVE;
  } else {
    loginView.classList.add('hidden');
    recoveryView.classList.remove('hidden');
    recoveryView.classList.add('flex');
    tabRecovery.className = TAB_ACTIVE;
    tabLogin.className = TAB_INACTIVE;
    // Al entrar a recuperación, mostrar el paso 1 (solicitar código)
    const step1 = document.getElementById('recovery-step-1');
    const step2 = document.getElementById('recovery-step-2');
    if (step1) step1.classList.remove('hidden');
    if (step2) step2.classList.add('hidden');
  }
}

// Mostrar / ocultar contrasena
function togglePasswordVisibility() {
  const pwdInput = document.getElementById('input-password');
  const icon = document.getElementById('password-toggle-icon');
  if (!pwdInput || !icon) return;
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    pwdInput.type = 'password';
    icon.textContent = 'visibility';
  }
}

// Sincroniza el checkbox visual de "recordar sesion"
function toggleRememberCheckbox(cb) {
  const box = document.getElementById('checkbox-visual');
  if (!box) return;
  if (cb.checked) {
    box.className = 'w-5 h-5 rounded-md bg-primary flex items-center justify-center text-on-primary transition-colors shadow-sm';
    box.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>';
  } else {
    box.className = 'w-5 h-5 rounded-md bg-surface-container-highest flex items-center justify-center text-transparent transition-colors';
    box.innerHTML = '';
  }
}

// Banner de retroalimentacion
function showFeedback(title, desc, isSuccess = true) {
  const banner = document.getElementById('feedback-banner');
  const icon = document.getElementById('feedback-icon');
  const titleEl = document.getElementById('feedback-title');
  const descEl = document.getElementById('feedback-desc');
  if (!banner || !icon || !titleEl || !descEl) return;

  titleEl.textContent = title;
  descEl.textContent = desc;

  if (isSuccess) {
    icon.textContent = 'check_circle';
    icon.className = 'material-symbols-outlined text-primary text-[22px]';
  } else {
    icon.textContent = 'warning';
    icon.className = 'material-symbols-outlined text-error text-[22px]';
  }
  banner.classList.remove('hidden');
  banner.classList.add('flex');
}

// Login contra el backend: valida, guarda sesion local y redirige al dashboard
async function handleLoginAction(event) {
  if (event) event.preventDefault();

  const identifier = document.getElementById('input-identifier').value.trim();
  const password = document.getElementById('input-password').value;
  const remember = document.getElementById('remember-me').checked;
  const btn = document.getElementById('btn-login-submit');

  if (!identifier || !password.trim()) {
    showFeedback('Campos requeridos', 'Por favor ingresa tu identificación y clave para acceder al portal.', false);
    return;
  }

  btn.disabled = true;
  btn.classList.add('opacity-80');
  btn.innerHTML = LOGIN_BTN_LOADING;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    let data = null;
    try { data = await response.json(); } catch (e) { /* respuesta sin JSON */ }

    if (!response.ok) {
      const msg = (data && data.error) ? data.error : 'No se pudo iniciar sesión. Intenta de nuevo.';
      const bloqueado = response.status === 429;
      showFeedback(bloqueado ? 'Cuenta bloqueada temporalmente' : 'Acceso denegado', msg, false);
      return;
    }

    showFeedback('Acceso Autorizado', `Bienvenido, ${data.nombres || ''} ${data.apellidos || ''}`.trim() + '.', true);

    // La sesión real vive en el servidor (cookie HttpOnly creada por /api/auth/login).
    // Aquí solo se guarda caché de UI (nombre/rol para el sidebar).
    if (window.ClinicaAuth && window.ClinicaAuth.saveSessionCache) {
      window.ClinicaAuth.saveSessionCache(data, remember);
    } else {
      try {
        const storage = remember ? localStorage : sessionStorage;
        (remember ? sessionStorage : localStorage).removeItem('clinica.session');
        storage.setItem('clinica.session', JSON.stringify({
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

    // replace() en lugar de href: no deja el login en el historial (el "atras" no vuelve aqui).
    // Si el guardia guardo una ruta en 'clinica.next', se retoma despues del login.
    let target = '/dashboard';
    try {
      if (window.ClinicaAuth) target = window.ClinicaAuth.consumeNext('/dashboard');
    } catch (e) { /* destino por defecto */ }
    setTimeout(() => { window.location.replace(target); }, 700);
  } catch (error) {
    showFeedback('Error de conexión', 'No se pudo contactar al servidor. Verifica tu conexión e intenta de nuevo.', false);
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-80');
    btn.innerHTML = LOGIN_BTN_DEFAULT;
  }
}

// Recuperación de cuenta REAL: solicita el código al backend, que lo envía
// al correo registrado (POST /api/auth/recovery). Respuesta genérica para
// no revelar si la cuenta existe.
async function handleRecoveryAction() {
  const input = document.getElementById('recovery-input').value.trim();
  const btn = document.getElementById('btn-recovery-submit');

  if (!input) {
    showFeedback('Identificación Requerida', 'Ingresa tu correo o cédula para enviar el código de restablecimiento.', false);
    return;
  }

  btn.disabled = true;
  btn.classList.add('opacity-80');
  btn.innerHTML = RECOVERY_BTN_LOADING;

  try {
    const response = await fetch('/api/auth/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ identifier: input })
    });
    let data = null;
    try { data = await response.json(); } catch (e) { /* respuesta sin JSON */ }
    if (!response.ok) {
      showFeedback('No se pudo solicitar', (data && data.error) ? data.error : 'Intenta de nuevo en unos minutos.', false);
      return;
    }
    showFeedback('Código enviado', (data && data.message) ? data.message : 'Revisa tu correo e ingresa el código de 6 dígitos.', true);
    const step1 = document.getElementById('recovery-step-1');
    const step2 = document.getElementById('recovery-step-2');
    if (step1) step1.classList.add('hidden');
    if (step2) step2.classList.remove('hidden');
    const codeInput = document.getElementById('recovery-code');
    if (codeInput) codeInput.focus();
  } catch (error) {
    showFeedback('Error de conexión', 'No se pudo contactar al servidor. Verifica tu conexión e intenta de nuevo.', false);
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-80');
    btn.innerHTML = RECOVERY_BTN_DEFAULT;
  }
}

// Canje del código por la contraseña nueva (POST /api/auth/reset)
async function handleResetAction() {
  const code = document.getElementById('recovery-code').value.trim();
  const pwd = document.getElementById('recovery-new-password').value;
  const confirm = document.getElementById('recovery-confirm-password').value;
  const btn = document.getElementById('btn-reset-submit');

  if (!/^\d{6}$/.test(code)) {
    showFeedback('Código inválido', 'Ingresa el código de 6 dígitos que llegó a tu correo.', false);
    return;
  }
  const politica = cumplePoliticaPassword(pwd);
  if (politica) {
    showFeedback('Contraseña débil', politica, false);
    return;
  }
  if (pwd !== confirm) {
    showFeedback('No coinciden', 'La nueva contraseña y su confirmación no coinciden.', false);
    return;
  }

  btn.disabled = true;
  btn.classList.add('opacity-80');
  btn.innerHTML = RESET_BTN_LOADING;

  try {
    const response = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ codigo: code, nuevaPassword: pwd })
    });
    let data = null;
    try { data = await response.json(); } catch (e) { /* respuesta sin JSON */ }
    if (!response.ok) {
      showFeedback('No se pudo restablecer', (data && data.error) ? data.error : 'Verifica el código e intenta de nuevo.', false);
      return;
    }
    showFeedback('Contraseña restablecida', (data && data.message) ? data.message : 'Ya puede iniciar sesión.', true);
    setTimeout(() => switchAuthView('login'), 1200);
  } catch (error) {
    showFeedback('Error de conexión', 'No se pudo contactar al servidor. Verifica tu conexión e intenta de nuevo.', false);
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-80');
    btn.innerHTML = RESET_BTN_DEFAULT;
  }
}

// Enter en recuperacion + submit del formulario de login
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  if (form) form.addEventListener('submit', handleLoginAction);

  const recoveryInput = document.getElementById('recovery-input');
  if (recoveryInput) {
    recoveryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRecoveryAction();
      }
    });
  }
});
