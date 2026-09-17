/**
 * Component Loader Utility - Sistema Odontológico
 * Carga componentes HTML dinámicamente para reutilización en el sistema de gestión odontológica
 * Adaptado de Bigrado para el contexto de clínica dental
 */

class ComponentLoader {
    constructor() {
        this.loadedComponents = new Map();
    }

    /**
     * Cargar un componente e insertarlo en el elemento especificado
     * @param {string} componentPath - Ruta al archivo HTML del componente
     * @param {string} containerId - ID del elemento donde se debe insertar el componente
     * @param {function} callback - Función callback opcional para ejecutar después de cargar
     */
    async loadComponent(componentPath, containerId, callback = null) {
        try {
            // Verificar si el componente ya está cargado
            if (this.loadedComponents.has(componentPath)) {
                const cachedContent = this.loadedComponents.get(componentPath);
                this.insertComponent(containerId, cachedContent);
                if (callback) callback();
                return;
            }

            // Obtener contenido del componente
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`Error al cargar componente: ${componentPath}`);
            }

            const componentHTML = await response.text();
            
            // Cachear el componente
            this.loadedComponents.set(componentPath, componentHTML);
            
            // Insertar componente en el contenedor
            this.insertComponent(containerId, componentHTML);
            
            // Ejecutar callback si se proporciona
            if (callback) callback();
            
        } catch (error) {
            console.error(`Error cargando componente ${componentPath}:`, error);
            document.getElementById(containerId).innerHTML = 
                `<div class="component-error">Error cargando componente: ${componentPath}</div>`;
        }
    }

    /**
     * Insertar HTML del componente en el contenedor especificado
     * @param {string} containerId - ID del elemento contenedor
     * @param {string} html - Contenido HTML a insertar
     */
    insertComponent(containerId, html) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
        } else {
            console.error(`Contenedor con ID '${containerId}' no encontrado`);
        }
    }

    /**
     * Cargar componente topbar del sistema odontológico
     * @param {string} containerId - ID del elemento contenedor (default: 'topbar-container')
     * @param {function} callback - Función callback opcional
     */
    async loadTopbar(containerId = 'topbar-container', callback = null) {
        // Callback para cargar información del usuario después de insertar el topbar
        const wrappedCallback = async () => {
            if (callback) callback();
            
            // Cargar información del usuario dinámicamente
            await this.loadUserInfoInTopbar();
        };
        
        await this.loadComponent('/Components/topbar.html', containerId, wrappedCallback);
    }
    
    /**
     * Cargar información del usuario en el topbar del sistema odontológico
     */
    async loadUserInfoInTopbar() {
        console.log('🦷 Cargando información del usuario en sistema odontológico...');
        
        try {
            const response = await fetch('/api/auth/current-user', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('📡 Respuesta del servidor odontológico:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Datos del usuario recibidos (Sistema Odontológico):', data);
                
                // Actualizar nombre del profesional/usuario
                const nameElement = document.getElementById('user-display-name');
                if (nameElement) {
                    const displayName = data.fullName || 
                                      `${data.nombres || ''} ${data.apellidos || ''}`.trim() || 
                                      data.username || 'Usuario';
                    nameElement.textContent = displayName;
                    console.log('📝 Nombre actualizado:', displayName);
                }
                
                // Actualizar email
                const emailElement = document.getElementById('user-display-email');
                if (emailElement) {
                    const displayEmail = data.email || data.correoElectronico || data.username || 'Sin correo';
                    emailElement.textContent = displayEmail;
                    console.log('📧 Email actualizado:', displayEmail);
                }
                
                // Actualizar rol si existe elemento para ello
                const roleElement = document.getElementById('user-display-role');
                if (roleElement && data.rol) {
                    let roleText = 'Usuario';
                    const roleName = (data.rol.nombre || data.nombreRol || '').toLowerCase();
                    
                    if (roleName.includes('admin')) {
                        roleText = 'Administrador';
                    } else if (roleName.includes('odontologo') || roleName.includes('doctor')) {
                        roleText = 'Odontólogo';
                    } else if (roleName.includes('recepcion')) {
                        roleText = 'Recepcionista';
                    }
                    
                    roleElement.textContent = roleText;
                    console.log('👨‍⚕️ Rol actualizado:', roleText);
                }
                
                console.log('✅ Información de usuario cargada en topbar odontológico');
            } else {
                console.error('❌ Error al cargar información:', response.status, response.statusText);
                const nameElement = document.getElementById('user-display-name');
                const emailElement = document.getElementById('user-display-email');
                if (nameElement) nameElement.textContent = 'Error al cargar';
                if (emailElement) emailElement.textContent = 'Verifica tu sesión';
            }
        } catch (error) {
            console.error('❌ Error cargando información del usuario:', error);
            const nameElement = document.getElementById('user-display-name');
            const emailElement = document.getElementById('user-display-email');
            if (nameElement) nameElement.textContent = 'Error de conexión';
            if (emailElement) emailElement.textContent = 'Intenta recargar';
        }
    }

    /**
     * Cargar componente sidebar del sistema odontológico
     * @param {string} containerId - ID del elemento contenedor (default: 'sidebar-container')
     * @param {function} callback - Función callback opcional
     */
    async loadSidebar(containerId = 'sidebar-container', callback = null) {
        const wrappedCallback = () => {
            if (callback) callback();
            // Aplicar estado activo después de que el sidebar sea cargado e insertado
            const currentPage = document.body.getAttribute('data-page') || '';
            if (currentPage) {
                this.updateSidebarActiveState(currentPage);
            }
        };
        await this.loadComponent('/Components/sidebar.html', containerId, wrappedCallback);
    }

    /**
     * Actualizar estado activo del sidebar basado en la página actual del sistema odontológico
     * @param {string} currentPage - Identificador de página actual (e.g., 'usuarios', 'citas', 'pacientes')
     */
    updateSidebarActiveState(currentPage) {
        // Usar setTimeout para asegurar que el DOM esté completamente actualizado
        setTimeout(() => {
            // Remover todas las clases activas
            const sidebarLinks = document.querySelectorAll('.sidebar-menu a, .nav-link');
            sidebarLinks.forEach(link => link.classList.remove('active'));

            // Mapear identificadores de página a rutas reales (VistaController + templates).
            // Solo existen estas vistas: cualquier otra sección muestra advertencia
            // en consola en lugar de navegar a un 404.
            const pageToFile = {
                'dashboard': '/dashboard',
                'citas': '/citas',
                'agenda': '/agenda',
                'pacientes': '/pacientes',
                'odontologos': '/odontologos',
                'historia': '/historias-clinicas',
                'historias-clinicas': '/historias-clinicas',
                'usuarios': '/usuarios',
                'configuracion': '/configuracion'
            };

            const targetFile = pageToFile[currentPage];
            if (targetFile) {
                // Buscar coincidencia exacta para el href
                const currentLink = document.querySelector(`.sidebar-menu a[href="${targetFile}"], .nav-link[href="${targetFile}"]`) ||
                                  document.querySelector(`.sidebar-menu a[data-view="${currentPage}"], .nav-link[data-view="${currentPage}"]`);
                
                if (currentLink) {
                    currentLink.classList.add('active');
                    console.log(`✅ Estado activo establecido para: ${currentPage} -> ${targetFile}`);
                } else {
                    console.warn(`❌ Enlace no encontrado para: ${targetFile}`);
                }
            } else {
                console.warn(`❌ No se encontró mapeo para la página: ${currentPage}`);
            }
        }, 50);
    }

    /**
     * Cargar todos los componentes comunes (topbar y sidebar) del sistema odontológico
     * @param {string} currentPage - Identificador de página actual para estado activo
     */
    async loadCommonComponents(currentPage = '') {
        try {
            await Promise.all([
                this.loadTopbar(),
                this.loadSidebar()
            ]);
            
            console.log(`🦷 Componentes cargados para página del sistema odontológico: ${currentPage}`);
            
        } catch (error) {
            console.error('Error cargando componentes del sistema odontológico:', error);
        }
    }
}

// Instancia global
const componentLoader = new ComponentLoader();

// Auto-cargar componentes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, verificando contenedores de componentes del sistema odontológico...');
    
    // Verificar si existen contenedores y cargar componentes
    const topbarContainer = document.getElementById('topbar-container');
    const sidebarContainer = document.getElementById('sidebar-container');
    
    if (topbarContainer || sidebarContainer) {
        const currentPage = document.body.getAttribute('data-page') || '';
        console.log(`📄 Página actual detectada en sistema odontológico: ${currentPage}`);
        
        componentLoader.loadCommonComponents(currentPage);
        
        // Inicializar efecto de scroll para topbar
        initTopbarScrollEffect();
    } else {
        console.log('ℹ️ No se encontraron contenedores de componentes en esta página');
    }
});

// Efecto de scroll para topbar del sistema odontológico
function initTopbarScrollEffect() {
    let ticking = false;
    
    function updateTopbar() {
        const topbar = document.querySelector('.topbar');
        if (topbar) {
            if (window.scrollY > 10) {
                topbar.classList.add('scrolled');
            } else {
                topbar.classList.remove('scrolled');
            }
        }
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateTopbar);
            ticking = true;
        }
    }
    
    // Agregar listener de scroll con throttling
    window.addEventListener('scroll', requestTick);
}

// Funciones de utilidad para acceso más fácil en el sistema odontológico
window.loadTopbar = (containerId, callback) => componentLoader.loadTopbar(containerId, callback);
window.loadSidebar = (containerId, callback) => componentLoader.loadSidebar(containerId, callback);
window.loadComponents = (currentPage) => componentLoader.loadCommonComponents(currentPage);
window.updateSidebarActive = (currentPage) => componentLoader.updateSidebarActiveState(currentPage);

// Forzar actualización del estado activo (útil para debugging)
window.forceUpdateSidebar = (currentPage) => {
    console.log(`🔧 Actualizando forzosamente sidebar para sistema odontológico: ${currentPage}`);
    componentLoader.updateSidebarActiveState(currentPage);
};

// Funcionalidad de toggle del sidebar móvil para sistema odontológico
let sidebarOpen = false;

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar, #sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const hamburger = document.querySelector('.hamburger-menu, #mobileMenuToggle');
    
    sidebarOpen = !sidebarOpen;
    
    if (sidebar) {
        if (sidebarOpen) {
            sidebar.classList.add('show');
            sidebar.classList.remove('mobile-hidden');
            if (overlay) overlay.classList.add('show');
            if (hamburger) hamburger.classList.add('active');
            // Prevenir scroll del body cuando el sidebar está abierto
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('show');
            sidebar.classList.add('mobile-hidden');
            if (overlay) overlay.classList.remove('show');
            if (hamburger) hamburger.classList.remove('active');
            // Restaurar scroll del body
            document.body.style.overflow = '';
        }
    }
}

// Cerrar sidebar al redimensionar la ventana si estamos en desktop
function handleResize() {
    if (window.innerWidth > 768 && sidebarOpen) {
        toggleSidebar(); // Cerrar sidebar si cambiamos a desktop
    }
}

// Hacer la función global para que pueda ser llamada desde el HTML
window.toggleSidebar = toggleSidebar;

// Agregar listener para redimensionamiento
window.addEventListener('resize', handleResize);

// Función para alternar el dropdown del usuario en sistema odontológico
function toggleUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.user-info')) {
                dropdown.classList.remove('show');
            }
        });
    }
}

// Función para ir a configuración del sistema odontológico
function goToSettings() {
    // Redirigir a configuración del sistema odontológico
    window.location.href = '/configuracion';
}

// Función para ir al perfil del usuario.
// NOTA: no existe una vista de perfil en el sistema (sin ruta ni template),
// por eso se informa en lugar de navegar a un 404.
function goToProfile() {
    if (window.Swal && typeof window.Swal.fire === 'function') {
        window.Swal.fire({
            icon: 'info',
            title: 'Mi perfil',
            text: 'La vista de perfil aún no está disponible en el sistema.',
            confirmButtonText: 'Entendido'
        });
    } else {
        alert('La vista de perfil aún no está disponible en el sistema.');
    }
}

// Función para mostrar información de la clínica
function showClinicInfo() {
    alert('Información de la Clínica Odontológica');
    // Aquí implementarías la lógica para mostrar información de la clínica
}

// Navegación específica del sistema odontológico.
// Solo rutas reales (VistaController): nacionalizar aquí evita 404 por
// enlaces obsoletos (historia-clinica, reportes, inventario, tratamientos).
function navigateToSection(section) {
    const routes = {
        'dashboard': '/dashboard',
        'citas': '/citas',
        'agenda': '/agenda',
        'pacientes': '/pacientes',
        'odontologos': '/odontologos',
        'historia': '/historias-clinicas',
        'historias-clinicas': '/historias-clinicas',
        'usuarios': '/usuarios',
        'configuracion': '/configuracion'
    };
    
    if (routes[section]) {
        window.location.href = routes[section];
    } else {
        console.warn(`Sección no encontrada en sistema odontológico: ${section}`);
    }
}

// Función para manejar navegación del sidebar con Alpine.js o JavaScript vanilla
function handleSidebarNavigation() {
    // Si estamos usando Alpine.js
    if (window.Alpine) {
        console.log('🦷 Navegación del sidebar configurada con Alpine.js');
    } else {
        // Configuración vanilla JavaScript para navegación
        document.addEventListener('click', function(event) {
            const navLink = event.target.closest('.nav-link[data-view]');
            if (navLink) {
                event.preventDefault();
                const view = navLink.getAttribute('data-view');
                navigateToSection(view);
            }
        });
        console.log('🦷 Navegación del sidebar configurada con JavaScript vanilla');
    }
}

// Inicializar navegación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    handleSidebarNavigation();
});

// Hacer funciones globales disponibles
window.toggleUserDropdown = toggleUserDropdown;
window.goToSettings = goToSettings;
window.goToProfile = goToProfile;
window.showClinicInfo = showClinicInfo;
window.navigateToSection = navigateToSection;

// NOTA: La función logout() debe estar definida en /js/CerrarSesion.js
// Asegúrate de incluir ese script en todas las páginas que usen el topbar con logout

console.log('🦷 Sistema de componentes para clínica odontológica inicializado correctamente');
