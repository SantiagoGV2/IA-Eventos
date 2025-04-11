'use strict';

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

        try {
            const response = await fetch('http://localhost:8080/project-AI/eventoComuAG', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('jwtToken') // 👈 Aquí lo agregamos
                },
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
