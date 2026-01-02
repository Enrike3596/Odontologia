/**
 * Script de manejo del formulario de contacto
 * Gestiona el envío de mensajes desde la página de inicio
 */

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
});

/**
 * Maneja el envío del formulario de contacto
 * @param {Event} event - Evento del formulario
 */
async function handleContactFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const msgSubmit = document.getElementById('msgSubmit');
    
    // Obtener datos del formulario
    const formData = {
        nombre: form.querySelector('#name').value.trim(),
        email: form.querySelector('#email').value.trim(),
        telefono: form.querySelector('#phone').value.trim(),
        servicio: form.querySelector('#subject').value,
        mensaje: form.querySelector('#message').value.trim()
    };
    
    // Validación básica
    if (!formData.nombre || !formData.email || !formData.telefono || !formData.servicio || !formData.mensaje) {
        mostrarMensaje(msgSubmit, 'Por favor, completa todos los campos', 'error');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        mostrarMensaje(msgSubmit, 'Por favor, ingresa un correo electrónico válido', 'error');
        return;
    }
    
    // Deshabilitar botón durante el envío
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    
    try {
        // Simular envío (aquí deberías implementar la lógica real de envío)
        // Puedes enviar a un endpoint del backend o a un servicio de email
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mostrar mensaje de éxito
        mostrarMensaje(msgSubmit, '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.', 'success');
        
        // Limpiar formulario
        form.reset();
        
        // Opcional: Redirigir después de 3 segundos
        setTimeout(() => {
            msgSubmit.classList.add('hidden');
        }, 5000);
        
    } catch (error) {
        console.error('Error al enviar el formulario:', error);
        mostrarMensaje(msgSubmit, 'Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.', 'error');
    } finally {
        // Rehabilitar botón
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Mensaje';
    }
}

/**
 * Muestra un mensaje de estado al usuario
 * @param {HTMLElement} element - Elemento donde mostrar el mensaje
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje ('success' o 'error')
 */
function mostrarMensaje(element, message, type) {
    element.textContent = message;
    element.classList.remove('hidden');
    element.style.color = type === 'success' ? '#10b981' : '#ef4444';
    element.style.marginTop = '15px';
    element.style.fontSize = '16px';
    element.style.fontWeight = '500';
}
