// ===== MÓDULO DE USUARIOS - SISTEMA ODONTOLÓGICO =====
// Adaptado de Bigrado para el sistema de gestión odontológica

// ===== FUNCIONES SWEETALERT2 =====
// Forzar que el contenedor de SweetAlert2 esté siempre por encima de los modales
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    // Aumentar z-index para que SweetAlert siempre quede por encima de modales personalizados
    style.innerHTML = `.swal2-container { z-index: 7000 !important; }`;
    document.head.appendChild(style);
    
    // Test para verificar que el archivo JavaScript se carga correctamente
    console.log('usuarios.js - Sistema Odontológico cargado correctamente');
});

// Alertas SweetAlert2 modernas y dinámicas para el sistema odontológico
function showSuccessAlert(message) {
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        html: `<div style="display:flex;align-items:center;font-size:1.1rem;"><span style='font-size:1.5rem;margin-right:8px;'>✅</span> <span>${message}</span></div>`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true,
        background: '#f0f9ff',
        color: '#0369a1',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
}

function showErrorAlert(message) {
    Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: message,
        showConfirmButton: true,
        confirmButtonColor: '#dc2626',
        background: '#fef2f2',
        color: '#991b1b',
        animation: true
    });
}

function showWarningAlert(message) {
    Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: message,
        showConfirmButton: true,
        confirmButtonColor: '#f59e0b',
        background: '#fffbeb',
        color: '#92400e',
        animation: true
    });
}

function showInfoAlert(message) {
    Swal.fire({
        icon: 'info',
        title: 'Información',
        text: message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true,
        background: '#f0f9ff',
        color: '#0284c7',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
}

// Confirmación elegante para eliminar usuarios del sistema odontológico
function confirmDeleteUserAction(userId, userName, callback) {
    Swal.fire({
        title: '¿Está seguro?',
        text: `Esta acción eliminará al usuario "${userName}" de forma permanente del sistema odontológico.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#0284c7',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        background: '#fff',
        animation: true,
        customClass: {
            popup: 'swal-odontologia'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Segunda confirmación para acciones críticas
            Swal.fire({
                title: 'Confirmación final',
                text: `¿Realmente desea eliminar a "${userName}"? Esta acción no se puede deshacer.`,
                icon: 'error',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, eliminar definitivamente',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
                background: '#fef2f2',
                animation: true
            }).then((finalResult) => {
                if (finalResult.isConfirmed) {
                    if (callback && typeof callback === 'function') {
                        callback(userId);
                    }
                } else {
                    showInfoAlert('Eliminación cancelada');
                }
            });
        } else {
            showInfoAlert('Eliminación cancelada');
        }
    });
}

// Variables globales para almacenar usuarios y roles del sistema odontológico
let allUsers = [];
let filteredUsers = [];
let allRoles = [];
let currentUserForAction = null;

// Funciones para las acciones de usuario en el sistema odontológico
function viewUser(userId) {
    // Mostrar indicador de carga en el modal
    openViewUserModal();
    
    // Mostrar estado de carga
    document.getElementById('viewUserTitle').textContent = 'Cargando detalles del usuario...';
    document.getElementById('viewUserName').textContent = 'Cargando...';
    document.getElementById('viewUserEmail').textContent = 'Cargando...';
    
    fetch(`/api/usuarios/${userId}`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(usuario => {
        populateViewUserModal(usuario);
    })
    .catch(error => {
        console.error('Error al cargar detalles del usuario:', error);
        closeViewUserModal();
        showErrorAlert(`Error al cargar los detalles del usuario: ${error.message}`);
    });
}

function populateViewUserModal(usuario) {
    // Información básica
    const nombreCompleto = `${formatValue(usuario.nombres)} ${formatValue(usuario.apellidos)}`;
    document.getElementById('viewUserTitle').textContent = `Detalles de ${nombreCompleto}`;
    document.getElementById('viewUserName').textContent = nombreCompleto;
    document.getElementById('viewUserEmail').textContent = formatValue(usuario.email || usuario.correoElectronico);
    
    // Avatar con iniciales
    const avatar = document.getElementById('viewUserAvatar');
    const initials = getInitials(usuario.nombres, usuario.apellidos);
    avatar.innerHTML = `<i class="fas fa-user"></i>`;
    
    // Badges de rol y estado adaptados al sistema odontológico
    const roleElement = document.getElementById('viewUserRole');
    
    // Determinar rol del sistema odontológico
    let roleClass = 'recepcionista';
    let roleText = 'Recepcionista';
    
    if (usuario.rol) {
        const roleName = usuario.rol.nombre || usuario.nombreRol || '';
        if (roleName.toLowerCase().includes('admin')) {
            roleClass = 'admin';
            roleText = 'Administrador';
        } else if (roleName.toLowerCase().includes('odontologo') || roleName.toLowerCase().includes('doctor')) {
            roleClass = 'odontologo';
            roleText = 'Odontólogo';
        } else {
            roleClass = 'recepcionista';
            roleText = 'Recepcionista';
        }
    }
    
    roleElement.className = `role-badge ${roleClass}`;
    roleElement.textContent = roleText;
    
    // Estado del usuario
    const isActive = usuario.activo === true || usuario.estado === 'ACTIVO';
    const statusClass = isActive ? 'active' : 'inactive';
    const statusText = isActive ? 'Activo' : 'Inactivo';
    
    // Información personal
    document.getElementById('viewUserDocument').textContent = formatValue(usuario.documento || usuario.numeroIdentificacion);
    document.getElementById('viewUserBirthdate').textContent = formatValue(usuario.fechaNacimiento);
    document.getElementById('viewUserGender').textContent = formatValue(usuario.genero);
    
    // Información de contacto
    document.getElementById('viewUserPhone').textContent = formatValue(usuario.telefono);
    document.getElementById('viewUserAddress').textContent = formatValue(usuario.direccion);
    document.getElementById('viewUserStatus').textContent = statusText;
}

function openViewUserModal() {
    const modal = document.getElementById('viewUserModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeViewUserModal() {
    const modal = document.getElementById('viewUserModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function editUserFromModal() {
    closeViewUserModal();
    // Obtener el ID del usuario desde el modal de vista
    const userId = currentUserForAction ? currentUserForAction.id : 1;
    editUser(userId);
}

function editUser(userId) {
    // Buscar el usuario en la lista cargada o hacer petición
    const user = allUsers.find(u => u.id === parseInt(userId) || u.idUsuario === parseInt(userId));
    
    if (user) {
        populateEditUserModal(user);
        openEditUserModal();
    } else {
        // Hacer petición para obtener datos del usuario
        fetch(`/api/usuarios/${userId}`)
        .then(response => response.json())
        .then(usuario => {
            populateEditUserModal(usuario);
            openEditUserModal();
        })
        .catch(error => {
            console.error('Error al cargar usuario:', error);
            showErrorAlert('Error al cargar los datos del usuario');
        });
    }
}

function populateEditUserModal(usuario) {
    // Título del modal
    const nombreCompleto = `${formatValue(usuario.nombres || usuario.firstName)} ${formatValue(usuario.apellidos || usuario.lastName)}`;
    document.getElementById('editUserTitle').textContent = `Editar Usuario - ${nombreCompleto}`;
    
    // Llenar campos del formulario
    document.getElementById('editUserId').value = usuario.id || usuario.idUsuario;
    
    // Mapear rol a valores del sistema odontológico
    let roleValue = 'recepcionista';
    if (usuario.rol || usuario.nombreRol) {
        const roleName = (usuario.rol?.nombre || usuario.nombreRol || '').toLowerCase();
        if (roleName.includes('admin')) {
            roleValue = 'administrador';
        } else if (roleName.includes('odontologo') || roleName.includes('doctor')) {
            roleValue = 'odontologo';
        } else {
            roleValue = 'recepcionista';
        }
    }
    document.getElementById('editRole').value = roleValue;
    
    // Información personal
    document.getElementById('editFirstName').value = formatValue(usuario.nombres || usuario.firstName, '');
    document.getElementById('editLastName').value = formatValue(usuario.apellidos || usuario.lastName, '');
    
    // Tipo de documento
    let docType = 'CC';
    if (usuario.tipoDocumento || usuario.tipoIdentificacion) {
        const tipo = (usuario.tipoDocumento || usuario.tipoIdentificacion).toUpperCase();
        docType = tipo.includes('CEDULA') ? 'CC' : 
                  tipo.includes('TARJETA') ? 'TI' : 
                  tipo.includes('EXTRANJERIA') ? 'CE' : 
                  tipo.includes('PASAPORTE') ? 'PP' : 'CC';
    }
    document.getElementById('editIdType').value = docType;
    
    document.getElementById('editIdNumber').value = formatValue(usuario.documento || usuario.numeroIdentificacion, '');
    document.getElementById('editBirthDate').value = formatValue(usuario.fechaNacimiento, '');
    
    // Género
    let gender = 'M';
    if (usuario.genero) {
        const gen = usuario.genero.toUpperCase();
        gender = gen.includes('MASCULINO') || gen === 'M' ? 'M' : 
                gen.includes('FEMENINO') || gen === 'F' ? 'F' : 'O';
    }
    document.getElementById('editGender').value = gender;
    
    // Información de contacto
    document.getElementById('editEmail').value = formatValue(usuario.email || usuario.correoElectronico, '');
    document.getElementById('editPhone').value = formatValue(usuario.telefono, '');
    document.getElementById('editAddress').value = formatValue(usuario.direccion, '');
    
    // Limpiar campos de contraseña
    if (document.getElementById('editPassword')) {
        document.getElementById('editPassword').value = '';
    }
    if (document.getElementById('editConfirmPassword')) {
        document.getElementById('editConfirmPassword').value = '';
    }
}

function openEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function toggleUserStatus(userId) {
    // Buscar el usuario en la lista de usuarios cargados
    const user = allUsers.find(u => u.id === parseInt(userId) || u.idUsuario === parseInt(userId));
    
    if (user) {
        populateToggleStatusModal(user);
        openToggleStatusModal();
    } else {
        showErrorAlert('Usuario no encontrado');
    }
}

function populateToggleStatusModal(user) {
    currentUserForAction = user;
    
    const isActive = user.activo === true || user.estado === 'ACTIVO';
    const action = isActive ? 'deactivate' : 'activate';
    
    // Actualizar contenido del modal
    const title = document.getElementById('toggleStatusTitle');
    const icon = document.getElementById('toggleStatusIcon');
    const warning = document.getElementById('statusWarning');
    const warningTitle = document.getElementById('warningTitle');
    const warningMessage = document.getElementById('warningMessage');
    
    // Información del usuario
    document.getElementById('toggleUserName').textContent = `${user.nombres || user.firstName} ${user.apellidos || user.lastName}`;
    document.getElementById('toggleUserEmail').textContent = user.email || user.correoElectronico;
    
    // Avatar con iniciales
    const avatar = document.getElementById('toggleUserAvatar');
    avatar.innerHTML = '<i class="fas fa-user"></i>';
    
    if (isActive) {
        title.textContent = 'Desactivar Usuario';
        icon.innerHTML = '<i class="fas fa-user-slash"></i>';
        icon.className = 'status-icon deactivate';
        warningTitle.textContent = '¿Está seguro de desactivar este usuario?';
        warningMessage.textContent = 'El usuario no podrá acceder al sistema odontológico hasta que sea reactivado.';
        warning.className = 'status-warning';
    } else {
        title.textContent = 'Activar Usuario';
        icon.innerHTML = '<i class="fas fa-user-check"></i>';
        icon.className = 'status-icon activate';
        warningTitle.textContent = '¿Está seguro de activar este usuario?';
        warningMessage.textContent = 'El usuario podrá acceder nuevamente al sistema odontológico.';
        warning.className = 'status-warning success';
    }
    
    // Configurar el evento del botón de confirmación
    const confirmBtn = document.getElementById('confirmStatusBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => confirmToggleStatus(user.id || user.idUsuario, action);
    }
}

function openToggleStatusModal() {
    const modal = document.getElementById('toggleUserStatusModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeToggleStatusModal() {
    const modal = document.getElementById('toggleUserStatusModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        currentUserForAction = null;
    }
}

function confirmToggleStatus(userId, action) {
    const actionText = action === 'activate' ? 'activado' : 'desactivado';
    const activo = action === 'activate';
    
    // Deshabilitar el botón para evitar doble click
    const confirmBtn = document.getElementById('confirmStatusBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${action === 'activate' ? 'Activando' : 'Desactivando'}...`;
    
    // Realizar petición PUT al servidor para cambiar el estado
    fetch(`/api/usuarios/${userId}/estado`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activo: activo })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        return response.text();
    })
    .then(message => {
        closeToggleStatusModal();
        showSuccessAlert(`Usuario ${actionText} exitosamente`);
        loadUsers(); // Recargar la lista de usuarios
    })
    .catch(error => {
        console.error('Error al cambiar estado:', error);
        showErrorAlert(`Error al ${action === 'activate' ? 'activar' : 'desactivar'} el usuario`);
    })
    .finally(() => {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    });
}

function deleteUser(userId) {
    // Buscar el usuario en la lista de usuarios cargados
    const user = allUsers.find(u => u.id === parseInt(userId) || u.idUsuario === parseInt(userId));
    
    if (user) {
        const userName = `${user.nombres || user.firstName} ${user.apellidos || user.lastName}`;
        confirmDeleteUserAction(userId, userName, confirmDeleteUser);
    } else {
        showErrorAlert('Usuario no encontrado');
    }
}

function confirmDeleteUser(userId) {
    fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        return response.text();
    })
    .then(message => {
        showSuccessAlert('Usuario eliminado exitosamente del sistema odontológico');
        loadUsers(); // Recargar la lista de usuarios
    })
    .catch(error => {
        console.error('Error al eliminar usuario:', error);
        showErrorAlert('Error al eliminar el usuario');
    });
}

// Función para abrir modal de nuevo usuario
function openNewUserModal() {
    const modal = document.getElementById('newUserModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Limpiar formulario
        const form = document.getElementById('newUserForm');
        if (form) {
            form.reset();
        }
    }
}

// Función para cerrar modal de nuevo usuario
function closeNewUserModal() {
    const modal = document.getElementById('newUserModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Alternar visibilidad de contraseña
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Funciones para filtros
function toggleFilters() {
    const filtersSection = document.getElementById('filtersSection');
    const toggleBtn = document.querySelector('.filter-toggle-btn');
    
    if (filtersSection.style.display === 'none' || filtersSection.style.display === '') {
        filtersSection.style.display = 'block';
        toggleBtn.classList.add('active');
    } else {
        filtersSection.style.display = 'none';
        toggleBtn.classList.remove('active');
    }
}

function applyFilters() {
    // Implementar lógica de filtros
    console.log('Aplicando filtros...');
    showInfoAlert('Filtros aplicados');
}

function clearFilters() {
    // Limpiar todos los campos de filtro
    const filterInputs = document.querySelectorAll('#filtersSection input, #filtersSection select');
    filterInputs.forEach(input => {
        input.value = '';
    });
    showInfoAlert('Filtros limpiados');
}

// Función para formatear valores y manejar nulos/undefined
function formatValue(value, defaultValue = 'Sin definir') {
    return value && value.toString().trim() !== '' ? value : defaultValue;
}

// Función para cargar usuarios desde el backend
function loadUsers() {
    fetch('/api/usuarios', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(usuarios => {
        allUsers = usuarios;
        filteredUsers = usuarios;
        renderUsersTable(usuarios);
        updateSummaryCards(usuarios);
    })
    .catch(error => {
        console.error('Error al cargar usuarios:', error);
        showErrorInTable('Error al cargar los usuarios del sistema odontológico');
    });
}

// Función para renderizar la tabla de usuarios
function renderUsersTable(usuarios) {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) return;
    
    if (usuarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4 block"></i>
                    No hay usuarios registrados en el sistema odontológico
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = usuarios.map(usuario => {
        const isActive = usuario.activo === true || usuario.estado === 'ACTIVO';
        const statusClass = isActive ? 'active' : 'inactive';
        const statusText = isActive ? 'Activo' : 'Inactivo';
        
        // Determinar rol
        let roleClass = 'recepcionista';
        let roleText = 'Recepcionista';
        
        if (usuario.rol) {
            const roleName = (usuario.rol.nombre || usuario.nombreRol || '').toLowerCase();
            if (roleName.includes('admin')) {
                roleClass = 'admin';
                roleText = 'Administrador';
            } else if (roleName.includes('odontologo') || roleName.includes('doctor')) {
                roleClass = 'odontologo';
                roleText = 'Odontólogo';
            }
        }
        
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                                ${getInitials(usuario.nombres || usuario.firstName, usuario.apellidos || usuario.lastName)}
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${formatValue(usuario.nombres || usuario.firstName)} ${formatValue(usuario.apellidos || usuario.lastName)}</div>
                            <div class="text-sm text-gray-500">${formatValue(usuario.email || usuario.correoElectronico)}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatValue(usuario.documento || usuario.numeroIdentificacion)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColorClass(roleClass)}">
                        ${roleText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(statusClass)}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Hace 2 horas</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="text-indigo-600 hover:text-indigo-900" onclick="viewUser(${usuario.id || usuario.idUsuario})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-blue-600 hover:text-blue-900" onclick="editUser(${usuario.id || usuario.idUsuario})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-yellow-600 hover:text-yellow-900" onclick="toggleUserStatus(${usuario.id || usuario.idUsuario})" title="Cambiar estado">
                            <i class="fas fa-user-slash"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-900" onclick="deleteUser(${usuario.id || usuario.idUsuario})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Función para obtener clases de color para roles
function getRoleColorClass(roleClass) {
    switch(roleClass) {
        case 'admin':
            return 'bg-purple-100 text-purple-800';
        case 'odontologo':
            return 'bg-green-100 text-green-800';
        case 'recepcionista':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Función para obtener clases de color para estados
function getStatusColorClass(statusClass) {
    switch(statusClass) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'inactive':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Función para generar iniciales
function getInitials(nombres, apellidos) {
    const nombre = (nombres || '').charAt(0).toUpperCase();
    const apellido = (apellidos || '').charAt(0).toUpperCase();
    return nombre + apellido || 'U';
}

// Función para actualizar las tarjetas de resumen
function updateSummaryCards(usuarios) {
    if (!usuarios || usuarios.length === 0) return;
    
    const total = usuarios.length;
    const odontologos = usuarios.filter(u => {
        const roleName = (u.rol?.nombre || u.nombreRol || '').toLowerCase();
        return roleName.includes('odontologo') || roleName.includes('doctor');
    }).length;
    const administradores = usuarios.filter(u => {
        const roleName = (u.rol?.nombre || u.nombreRol || '').toLowerCase();
        return roleName.includes('admin');
    }).length;
    const recepcionistas = total - odontologos - administradores;
    
    // Actualizar las tarjetas con los conteos
    const cards = document.querySelectorAll('.summary-card h3');
    if (cards.length >= 4) {
        cards[0].textContent = total.toLocaleString();
        cards[1].textContent = odontologos.toLocaleString();
        cards[2].textContent = administradores.toLocaleString();
        cards[3].textContent = recepcionistas.toLocaleString();
    }
}

// Función para mostrar errores en la tabla
function showErrorInTable(error) {
    const tbody = document.getElementById('usuariosTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4 block"></i>
                    ${error}
                </td>
            </tr>
        `;
    }
}

// Validación del formulario de nuevo usuario
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newUserForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener datos del formulario
            const formData = new FormData(form);
            
            // Construir objeto de usuario con los nombres correctos del DTO
            const usuarioData = {
                nombres: formData.get('nombres'),
                apellidos: formData.get('apellidos'),
                tipoDocumento: formData.get('tipoDocumento'),
                documento: formData.get('documento'),
                fechaNacimiento: formData.get('fechaNacimiento'),
                genero: formData.get('genero'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                direccion: formData.get('direccion'),
                password: formData.get('password'),
                activo: true
            };
            
            // Validar datos antes de enviar
            console.log('Datos del formulario capturados:', {
                nombres: usuarioData.nombres,
                apellidos: usuarioData.apellidos,
                email: usuarioData.email,
                documento: usuarioData.documento,
                rol: usuarioData.rol
            });
            
            // Validar campos requeridos
            if (!usuarioData.nombres || !usuarioData.apellidos || !usuarioData.email) {
                showWarningAlert('Por favor complete todos los campos requeridos');
                return;
            }
            
            if (usuarioData.password !== formData.get('confirmPassword')) {
                showWarningAlert('Las contraseñas no coinciden');
                return;
            }
            
            // Generar username basado en email si no se proporciona
            usuarioData.username = usuarioData.email.split('@')[0];
            
            // Convertir role a objeto para el DTO
            const roleValue = formData.get('role');
            if (roleValue) {
                usuarioData.rol = {
                    id: getRoleIdByName(roleValue),
                    nombre: roleValue
                };
                console.log('Rol asignado:', usuarioData.rol);
            } else {
                console.log('No se proporcionó rol, se usará por defecto');
            }
            
            console.log('Datos finales a enviar:', usuarioData);
            
            // Enviar datos al servidor
            crearUsuario(usuarioData);
        });
    }

    // Validación del formulario de editar usuario
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener datos del formulario
            const formData = new FormData(editForm);
            const usuarioData = Object.fromEntries(formData);
            
            // Validar campos requeridos
            if (!usuarioData.firstName || !usuarioData.lastName || !usuarioData.email) {
                showWarningAlert('Por favor complete todos los campos requeridos');
                return;
            }
            
            // Si se proporcionan contraseñas, validar que coincidan
            if (usuarioData.password && usuarioData.password !== usuarioData.confirmPassword) {
                showWarningAlert('Las contraseñas no coinciden');
                return;
            }
            
            // Remover confirmPassword antes de enviar
            delete usuarioData.confirmPassword;
            
            // Mapear campos al DTO
            const usuarioDto = {
                id: usuarioData.id,
                nombres: usuarioData.firstName,
                apellidos: usuarioData.lastName,
                tipoDocumento: usuarioData.idType,
                documento: usuarioData.idNumber,
                fechaNacimiento: usuarioData.birthDate,
                genero: usuarioData.gender,
                email: usuarioData.email,
                telefono: usuarioData.phone,
                direccion: usuarioData.address,
                username: usuarioData.email.split('@')[0], // Generar username
                password: usuarioData.password // Solo se enviará si no está vacío
            };

            // Convertir role a objeto para el DTO
            if (usuarioData.role) {
                usuarioDto.rol = {
                    id: getRoleIdByName(usuarioData.role),
                    nombre: usuarioData.role
                };
            }

            // Enviar datos al servidor
            actualizarUsuario(usuarioDto.id, usuarioDto);
        });
    }
    
    // Cargar usuarios al inicializar
    loadUsers();
});

// Cerrar modales al hacer clic fuera de ellos
document.addEventListener('click', function(event) {
    // Cerrar modal de nuevo usuario
    const newUserModal = document.getElementById('newUserModal');
    if (newUserModal && event.target === newUserModal) {
        closeNewUserModal();
    }
    
    // Cerrar modal de ver usuario
    const viewUserModal = document.getElementById('viewUserModal');
    if (viewUserModal && event.target === viewUserModal) {
        closeViewUserModal();
    }
    
    // Cerrar modal de editar usuario
    const editUserModal = document.getElementById('editUserModal');
    if (editUserModal && event.target === editUserModal) {
        closeEditUserModal();
    }
    
    // Cerrar modal de cambiar estado
    const toggleStatusModal = document.getElementById('toggleUserStatusModal');
    if (toggleStatusModal && event.target === toggleStatusModal) {
        closeToggleStatusModal();
    }
});

// Función para crear usuario
async function crearUsuario(usuarioData) {
    try {
        // Validar datos antes de enviar
        console.log('Datos a enviar:', usuarioData);
        
        // Mostrar loading
        Swal.fire({
            title: 'Creando usuario...',
            html: 'Por favor espere mientras procesamos la información',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Llamada real a la API
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(usuarioData)
        });
        
        if (!response.ok) {
            // Obtener el mensaje de error del servidor
            let errorMessage;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || `Error HTTP: ${response.status}`;
            } catch (e) {
                const errorText = await response.text();
                errorMessage = errorText || `Error HTTP: ${response.status}`;
            }
            throw new Error(errorMessage);
        }
        
        const newUser = await response.json();
        
        // Cerrar modal
        closeNewUserModal();
        
        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Usuario creado!',
            html: `
                <div class="text-center">
                    <p class="text-gray-600">El usuario <strong>${usuarioData.nombres} ${usuarioData.apellidos}</strong> ha sido creado exitosamente.</p>
                    <div class="mt-4 p-3 bg-green-50 rounded-lg">
                        <p class="text-sm text-green-700">
                            <i class="fas fa-info-circle mr-1"></i>
                            Ya puede acceder al sistema con sus credenciales
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#16a34a'
        });
        
        // Recargar lista
        loadUsers();
        
        // Limpiar formulario
        document.getElementById('newUserForm').reset();
        
    } catch (error) {
        console.error('Error detallado al crear usuario:', error);
        
        let errorMessage = 'No se pudo crear el usuario. Por favor intente nuevamente.';
        
        if (error.message.includes('duplicate key') || error.message.includes('already exists') || error.message.includes('UNIQUE')) {
            errorMessage = 'Ya existe un usuario con ese email o documento. Por favor use datos diferentes.';
        } else if (error.message.includes('constraint') || error.message.includes('required')) {
            errorMessage = 'Faltan campos requeridos o hay datos inválidos. Por favor revise la información.';
        } else if (error.message.includes('rol')) {
            errorMessage = 'Error con el rol seleccionado. Por favor seleccione un rol válido.';
        } else if (error.message && error.message !== 'No se pudo crear el usuario. Por favor intente nuevamente.') {
            errorMessage = error.message;
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Error al crear usuario',
            text: errorMessage,
            confirmButtonColor: '#dc2626'
        });
    }
}

// Función para actualizar usuario
async function actualizarUsuario(id, usuarioData) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Actualizando usuario...',
            html: 'Por favor espere mientras procesamos la información',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Llamada real a la API
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuarioData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const updatedUser = await response.json();
        
        // Cerrar modal
        closeEditUserModal();
        
        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Usuario actualizado!',
            html: `
                <div class="text-center">
                    <p class="text-gray-600">El usuario <strong>${usuarioData.nombres} ${usuarioData.apellidos}</strong> ha sido actualizado exitosamente.</p>
                    <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-info-circle mr-1"></i>
                            Los cambios ya están vigentes en el sistema
                        </p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0284c7'
        });
        
        // Recargar lista
        loadUsers();
        
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error al actualizar usuario',
            text: 'No se pudo actualizar el usuario. Por favor intente nuevamente.',
            confirmButtonColor: '#dc2626'
        });
    }
}

// Función para mapear nombres de rol a IDs
function getRoleIdByName(roleName) {
    const roleMap = {
        'administrador': 1,
        'odontologo': 2,
        'recepcionista': 3
    };
    return roleMap[roleName.toLowerCase()] || 3; // Default: recepcionista
}

console.log('Sistema de usuarios para clínica odontológica inicializado correctamente');
