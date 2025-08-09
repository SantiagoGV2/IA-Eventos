'use strict';
// --- Funciones Auxiliares de Notificación ---
function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: message,
        timer: 1500,
        showConfirmButton: false
    });
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message
    });
}

function showWarning(title, text) {
    Swal.fire({
        icon: 'warning',
        title: title,
        text: text
    });
}
function getAuthHeaders() {
    // Usar el nuevo sistema de autenticación seguro
    return window.authSecurity.getAuthHeaders();
}
// Manejo del formulario
const formCrearEvento = document.getElementById('formCrearEvento');
if (formCrearEvento) {
    formCrearEvento.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(formCrearEvento);
        const datos = Object.fromEntries(formData.entries());

        // Log para depurar
        console.log('Datos enviados:', {
            eveComuTitulo: datos.tituloEvento,
            eveComuDescripcion: datos.descripcion,
            eveComuFechaInicio: datos.fechaInicio,
            eveComuFechaFin: datos.fechaFin,
            eveComuUbicacion: datos.ubicacion,
            eveComuEnlace: datos.enlace,
            eveComuEstado: datos.estado,
            eveComuCategoria: datos.categoriaEvento,
        });
        const headers = getAuthHeaders();
        if (!headers) {
            window.authSecurity.redirectToLogin('Sesión requerida para crear eventos');
            return;
        }
        try {
            const response = await fetch(window.authSecurity.getApiUrl('/eventoComuAG'), {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    eveComuTitulo: datos.tituloEvento,
                    eveComuDescripcion: datos.descripcion,
                    eveComuFechaInicio: datos.fechaInicio,
                    eveComuFechaFin: datos.fechaFin,
                    eveComuUbicacion: datos.ubicacion,
                    eveComuEnlace: datos.enlace,
                    eveComuEstado: datos.estado,
                    eveComuCategoria: datos.categoriaEvento
                })
            });
            
            if (response.ok) {
                showSuccess("Registro exitoso (Evento)");
                formCrearEvento.reset();
            } else if (response.status === 401) {
                window.authSecurity.redirectToLogin('Sesión expirada');
            } else {
                console.error('Error al registrar (Evento):', await response.text());
                showError("Error al registrar el evento.");
            }
        } catch (error) {
            console.error('Error en la conexión (Evento):', error);
            showWarning("Error en la conexión con el servidor.");
        }
    });
}
