/**
 * SCROLL SPY PARA NAVEGACIÓN
 * Este script detecta la sección visible en el viewport y actualiza el enlace activo en el navbar
 */

document.addEventListener('DOMContentLoaded', function() {
    // Obtener todos los enlaces del menú de navegación
    const navLinks = document.querySelectorAll('.navbar-nav .nav-item a.page-scroll');
    
    // Obtener todas las secciones de la página
    const sections = document.querySelectorAll('section[id], header[id]');
    
    // Flag para controlar si estamos en un scroll programático
    let isProgrammaticScroll = false;
    let scrollTimeout = null;
    let targetSectionId = null; // Nueva variable para almacenar la sección objetivo
    let lastClickedLink = null; // Guardar el último enlace clickeado
    
    // Configuración del observador de intersección
    // Usar márgenes diferentes para móvil vs escritorio
    const isMobile = window.innerWidth <= 768;
    const observerOptions = {
        root: null, // viewport
        rootMargin: isMobile ? '-20% 0px -60% 0px' : '-15% 0px -65% 0px',
        threshold: 0
    };
    
    // Función para remover todas las clases active
    function removeAllActiveClasses() {
        navLinks.forEach(link => {
            link.classList.remove('active');
            link.parentElement.classList.remove('active');
        });
    }
    
    // Función para activar un enlace específico
    function activateLink(id) {
        removeAllActiveClasses();
        
        // Encontrar el enlace que apunta a esta sección y activarlo
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === '#' + id) {
                link.classList.add('active');
                link.parentElement.classList.add('active');
            }
        });
    }
    
    // Crear el observador de intersección
    const sectionObserver = new IntersectionObserver((entries) => {
        // Si estamos en un scroll programático, ignorar completamente el observer
        if (isProgrammaticScroll) {
            return;
        }
        
        entries.forEach(entry => {
            // Si la sección es visible y está en el área del viewport configurada
            if (entry.isIntersecting) {
                activateLink(entry.target.id);
            }
        });
    }, observerOptions);
    
    // Observar todas las secciones
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
    
    // Manejar clicks en los enlaces del menú para smooth scroll
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Solo manejar enlaces internos (que comienzan con #)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                e.stopImmediatePropagation(); // Evitar que otros event listeners procesen este click
                
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    // Guardar referencia al enlace clickeado
                    lastClickedLink = this;
                    
                    // Activar flag de scroll programático
                    isProgrammaticScroll = true;
                    targetSectionId = targetId; // Guardar el ID de la sección objetivo
                    
                    // Limpiar timeout anterior si existe
                    if (scrollTimeout) {
                        clearTimeout(scrollTimeout);
                    }
                    
                    // Activar inmediatamente el enlace clickeado
                    removeAllActiveClasses();
                    this.classList.add('active');
                    this.parentElement.classList.add('active');
                    
                    // Cerrar el menú móvil si está abierto
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        navbarCollapse.classList.remove('show');
                    }
                    if (navbarToggler && navbarToggler.classList.contains('active')) {
                        navbarToggler.classList.remove('active');
                    }
                    
                    // Calcular la posición considerando el header fijo
                    const navbar = document.querySelector('.navbar-area');
                    const headerTop = document.querySelector('.header-top');
                    
                    // Calcular altura total del header (navbar + header-top)
                    const navbarHeight = navbar ? navbar.offsetHeight : 0;
                    const headerTopHeight = headerTop ? headerTop.offsetHeight : 0;
                    const totalHeaderHeight = navbarHeight + headerTopHeight;
                    
                    // Añadir un pequeño margen adicional para mejor visualización
                    const offset = totalHeaderHeight + 20;
                    const targetPosition = targetSection.offsetTop - offset;
                    
                    // Pequeño delay para permitir que el menú se cierre primero
                    setTimeout(() => {
                        // Smooth scroll a la sección
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }, 100);
                    
                    // Desactivar flag después de que termine el scroll (3 segundos para asegurar)
                    scrollTimeout = setTimeout(() => {
                        isProgrammaticScroll = false;
                        targetSectionId = null; // Limpiar el ID objetivo
                        lastClickedLink = null;
                        // Forzar la activación del enlace correcto después del scroll
                        activateLink(targetId);
                    }, 3000);
                }
            }
        }, true); // Usar capture phase para ejecutarse antes que otros listeners
    });
    
    // Detectar cuando el usuario hace scroll manual para cancelar el modo programático
    let userScrollTimer;
    let isUserScrolling = false;
    
    window.addEventListener('scroll', function() {
        // Si estamos en scroll programático y el usuario intenta hacer scroll, mantener el enlace clickeado
        if (isProgrammaticScroll && lastClickedLink) {
            clearTimeout(userScrollTimer);
            userScrollTimer = setTimeout(() => {
                // Después de que el usuario deje de hacer scroll, verificar si seguimos en modo programático
                if (isProgrammaticScroll && lastClickedLink) {
                    removeAllActiveClasses();
                    lastClickedLink.classList.add('active');
                    lastClickedLink.parentElement.classList.add('active');
                }
            }, 150);
        }
    }, { passive: true });
    
    // Manejar el scroll inicial para activar la sección correcta al cargar la página
    window.addEventListener('load', function() {
        // Esperar un momento para que el DOM esté completamente renderizado
        setTimeout(() => {
            const scrollPosition = window.scrollY + 150; // Offset para mejor detección
            let currentSection = 'home'; // Por defecto, activar "Inicio"
            
            // Encontrar la sección actual basada en la posición del scroll
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSection = section.id;
                }
            });
            
            activateLink(currentSection);
        }, 100);
    });
});
