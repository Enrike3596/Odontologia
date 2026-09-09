/* Login - Clinica Odontologica (solo frontend).
 * Sin selector de tipo de usuario: el backend resuelve el rol tras validar credenciales.
 * TODO backend: conectar handleLoginAction() al endpoint real de autenticacion
 * (p. ej. POST /api/auth/login) y guardar token/sesion segura (cookie HttpOnly).
 */

const TAB_ACTIVE = 'flex-1 py-2.5 px-4 rounded-full text-[13px] leading-[18px] tracking-[0.015em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-surface-container-lowest text-primary shadow-sm';
const TAB_INACTIVE = 'flex-1 py-2.5 px-4 rounded-full text-[13px] leading-[18px] tracking-[0.015em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-on-surface-variant hover:text-on-surface';

const LOGIN_BTN_DEFAULT = '<span>Acceder al Portal Odontológico</span><span class="material-symbols-outlined text-[20px]">arrow_forward</span>';
const LOGIN_BTN_LOADING = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Verificando ficha clínica...</span>';
const RECOVERY_BTN_DEFAULT = '<span class="material-symbols-outlined text-[20px]">send</span><span>Enviar Enlace de Recuperación</span>';
const RECOVERY_BTN_LOADING = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Enviando código...</span>';

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

// Login (simulado en frontend: valida, guarda sesion local y redirige al dashboard)
function handleLoginAction(event) {
  if (event) event.preventDefault();

  const idInput = document.getElementById('input-identifier').value.trim();
  const pwdInput = document.getElementById('input-password').value.trim();
  const remember = document.getElementById('remember-me').checked;
  const btn = document.getElementById('btn-login-submit');

  if (!idInput || !pwdInput) {
    showFeedback('Campos requeridos', 'Por favor ingresa tu identificación y clave para acceder al portal.', false);
    return;
  }

  btn.disabled = true;
  btn.classList.add('opacity-80');
  btn.innerHTML = LOGIN_BTN_LOADING;

  // Simula latencia de red. Reemplazar por fetch() al endpoint real.
  setTimeout(() => {
    btn.disabled = false;
    btn.classList.remove('opacity-80');
    btn.innerHTML = LOGIN_BTN_DEFAULT;
    showFeedback('Acceso Autorizado', 'Bienvenido a tu historial odontológico.', true);

    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('clinica.session', JSON.stringify({ identifier: idInput, ts: Date.now() }));
    } catch (e) { /* almacenamiento no disponible: continuar igual */ }

    setTimeout(() => { window.location.href = '/dashboard'; }, 700);
  }, 900);
}

// Login biometrico (simulado)
function triggerBiometrics() {
  showFeedback('Validación Biométrica', 'Escaneando credencial FaceID / Huella registrada en dispositivo...', true);
  setTimeout(() => {
    showFeedback('Identidad Confirmada', 'Iniciando sesión segura con tu perfil médico.', true);
    setTimeout(() => { window.location.href = '/dashboard'; }, 700);
  }, 1100);
}

// Recuperacion de cuenta (simulado)
function handleRecoveryAction() {
  const input = document.getElementById('recovery-input').value.trim();
  const btn = document.getElementById('btn-recovery-submit');

  if (!input) {
    showFeedback('Identificación Requerida', 'Ingresa tu correo o cédula para enviar las instrucciones de restablecimiento.', false);
    return;
  }

  btn.disabled = true;
  btn.classList.add('opacity-80');
  btn.innerHTML = RECOVERY_BTN_LOADING;

  setTimeout(() => {
    btn.disabled = false;
    btn.classList.remove('opacity-80');
    btn.innerHTML = RECOVERY_BTN_DEFAULT;
    showFeedback('Código Emitido', 'Hemos despachado un código de 6 dígitos seguro con vigencia de 15 minutos.', true);
  }, 950);
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
