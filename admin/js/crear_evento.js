'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Obtener las categorias
        const catResponse = await fetch('http://localhost:8080/project-AI/categoria');
        const categorias = await catResponse.json();
        const catSelect = document.getElementById('categoria');
        categorias.forEach(cate => {
            const option = document.createElement('option');
            option.value = cate.catId;
            option.textContent = `${cate.catId} - ${cate.catNombre}`;
            catSelect.appendChild(option);
        });

        // Asignar automáticamente el admId al campo oculto desde localStorage
        const admId = localStorage.getItem('admId');
        if (admId) {
            document.getElementById('admId').value = admId;
        } else {
            console.warn('admId no encontrado en localStorage');
        }

    } catch (error) {
        console.error('Error al obtener datos:', error);
    }
});

// Manejo del formulario
const formCrearEvento = document.getElementById('formCrearEvento');
if (formCrearEvento) {
    formCrearEvento.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(formCrearEvento);
        const datos = Object.fromEntries(formData.entries());
        const admId = datos.admId;

        // Log para depurar
        console.log('Datos enviados:', {
            eveComuTitulo: datos.tituloEvento,
            eveComuDescripcion: datos.descripcion,
            eveComuFechaInicio: datos.fechaInicio,
            eveComuFechaFin: datos.fechaFin,
            eveComuUbicacion: datos.ubicacion,
            eveComuEnlace: datos.enlace,
            eveComuEstado: datos.estado,
            catId: datos.categoria,
            admId: admId
        });

        try {
            const response = await fetch(`http://localhost:8080/project-AI/eventoComuAG/${admId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eveComuTitulo: datos.tituloEvento,
                    eveComuDescripcion: datos.descripcion,
                    eveComuFechaInicio: datos.fechaInicio,
                    eveComuFechaFin: datos.fechaFin,
                    eveComuUbicacion: datos.ubicacion,
                    eveComuEnlace: datos.enlace,
                    eveComuEstado: datos.estado,
                    categoria: { catId: datos.categoria }
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
