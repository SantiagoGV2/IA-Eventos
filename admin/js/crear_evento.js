'use strict';
function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken"); // Obtiene el token LIMPIO
    if (!token) {
        console.error("No hay token para la petición.");
        return null;
    }
    return {
        "Authorization": `Bearer ${token}`, // AÑADE el prefijo "Bearer " aquí
        "Content-Type": "application/json"
    };
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
        if (!headers) return;
        try {
            const response = await fetch('http://localhost:8080/project-AI/eventoComuAG', {
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
                alert('Registro exitoso');
                formCrearEvento.reset();
            } else {
                console.error('Error al registrar (Evento):', await response.text());
                alert('Error al registrar el evento.');
            }
        } catch (error) {
            console.error('Error en la conexión (Evento):', error);
            alert('Error en la conexión con el servidor.');
        }
    });
}
