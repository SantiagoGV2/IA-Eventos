// Maneja el formulario de registro de categorias
const formCrear = document.getElementById('formCrearCategoria');
if (formCrear) {
   formCrear.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita el envío del formulario de forma tradicional

        // Obtén los datos del formulario
        const formData = new FormData(formCrear);
        const datos = Object.fromEntries(formData.entries());

        // Log de los datos enviados para depuración
        console.log('Datos enviados:', {
            catNombre: datos.nombreCategoria,
            catDescripcion: datos.descripcionCategoria,
            catFechaCreacion: datos.fechaCreacion
        });

        try {
            const response = await fetch('http://localhost:8080/project-AI/categoriaAG', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    catNombre: datos.nombreCategoria,
                    catDescripcion: datos.descripcionCategoria,
                    catFechaCreacion: datos.fechaCreacion
                })
            });

            if (response.ok) {
                alert('Registro exitoso');
                formCrear.reset(); // Reinicia el formulario
            } else {
                console.error('Error al registrar (Categoria):', await response.text());
                alert('Error al registrar.');
            }
        } catch (error) {
            console.error('Error (Categoria):', error);
            alert('Error en la conexión con el servidor.');
        }
    });
}