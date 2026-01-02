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
    
    // Configuración del observador de intersección
    const observerOptions = {
        root: null, // viewport
        rootMargin: '-15% 0px -65% 0px', // Activar cuando la sección esté en el 15% superior del viewport
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
        // Si estamos en un scroll programático, ignorar las detecciones del observer
        if (isProgrammaticScroll) {
            // Durante scroll programático, solo activar si es la sección objetivo
            if (targetSectionId) {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.target.id === targetSectionId) {
                        activateLink(entry.target.id);
                    }
                });
            }
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
                    // Activar flag de scroll programático
                    isProgrammaticScroll = true;
                    targetSectionId = targetId; // Guardar el ID de la sección objetivo
                    
                    // Limpiar timeout anterior si existe
                    if (scrollTimeout) {
                        clearTimeout(scrollTimeout);
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
                    
                    // Activar inmediatamente el enlace clickeado
                    removeAllActiveClasses();
                    this.classList.add('active');
                    this.parentElement.classList.add('active');
                    
                    // Smooth scroll a la sección
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Desactivar flag después de que termine el scroll (aproximadamente 1.5 segundos)
                    scrollTimeout = setTimeout(() => {
                        isProgrammaticScroll = false;
                        targetSectionId = null; // Limpiar el ID objetivo
                    }, 1500);
                    
                    // Cerrar el menú móvil si está abierto
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        navbarCollapse.classList.remove('show');
                    }
                    if (navbarToggler && navbarToggler.classList.contains('active')) {
                        navbarToggler.classList.remove('active');
                    }
                }
            }
        }, true); // Usar capture phase para ejecutarse antes que otros listeners
    });
    
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
