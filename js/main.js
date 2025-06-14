let eventosGuardadosIds = [];
document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("btnBuscar").addEventListener("click", buscarEventos);
    document.getElementById("btnLogout").addEventListener("click", cerrarSesion);
    document.getElementById("btnEventosUsuario").addEventListener("click", obtenerEventosPorUsuario);
    document.getElementById("btnHistorialEventos").addEventListener("click", HistorialPorUsuario);
    document.getElementById("btnBorrarHistorial").addEventListener("click", eliminarHistorial);
    document.getElementById("btnBorrarHistorial").classList.add("d-none");
    await obtenerUsuario();
    await obtenerEventosGuardadosIds();
});

//Panel usuario
document.getElementById('user-avatar').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('userPanel').classList.toggle('active');
});

// Cerrar el panel al hacer clic fuera
document.addEventListener('click', function(e) {
    const userPanel = document.getElementById('userPanel');
    if (!userPanel.contains(e.target) && e.target.id !== 'user-avatar') {
        userPanel.classList.remove('active');
    }
});
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

function obtenerIniciales(nombreCompleto) {
    if (!nombreCompleto) return "??";
    const palabras = nombreCompleto.trim().split(" ");
    if (palabras.length === 1) {
        return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

let usuarioGlobal = null;

async function obtenerUsuario() {
    const headers = getAuthHeaders();
    if (!headers) {
        cerrarSesion(); // Si no hay token, no podemos continuar.
        return;
    }
    try {
        const response = await fetch("http://localhost:8080/project-AI/usuarios/auth", {
           method: "GET",
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error("Sesión expirada, inicie sesión nuevamente");
            throw new Error("Error al obtener usuario");
        }

        usuarioGlobal = await response.json();
        console.log("Usuario autenticado:", usuarioGlobal);

        document.getElementById("usuario-info").textContent = `Bienvenido, ${usuarioGlobal.usuNombre}`;
        document.getElementById("panel-usuario-info").textContent = `${usuarioGlobal.usuNombre}`;
        const iniciales = obtenerIniciales(usuarioGlobal.usuNombre);
        document.getElementById("user-avatar").textContent = iniciales;
        document.getElementById("panel-user-avatar").textContent = iniciales;
        document.getElementById("btnLogout").classList.remove("d-none");

    } catch (error) {
        console.error("Error al obtener usuario:", error);
        alert(error.message);
        localStorage.removeItem("jwtToken");
        window.location.href = "/pages/login.html";
    }

    await obtenerEventosGuardadosIds();
}

async function obtenerEventosGuardadosIds() {
   const headers = getAuthHeaders();
    if (!headers) return; // Si no hay token, no hacer nada.

    try {
        const response = await fetch(`http://localhost:8080/project-AI/eventoGuardadoUsuario`, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            console.error("No se pudieron obtener los IDs de eventos guardados.");
            eventosGuardadosIds = [];
            return;
        }

        const eventosGuardados = await response.json();
        
        // **LA CLAVE ESTÁ AQUÍ**
        // Transformamos la respuesta completa en una lista simple de IDs.
        // Asumo que el objeto evento guardado tiene una estructura como { evento: { eveId: 123 } }
        // Ajusta 'evento.evento.eveId' según la estructura JSON que te devuelve tu API.
        eventosGuardadosIds = eventosGuardados
    .map(eg => eg.eventoId) 
    .filter(id => id != null);

console.log("IDs de eventos guardados cargados (CORREGIDO):", eventosGuardadosIds);

    } catch (error) {
        console.error("Error en obtenerEventosGuardadosIds:", error);
        eventosGuardadosIds = []; // En caso de error, reseteamos la lista.
    }
}


function cerrarSesion() {
    localStorage.removeItem('jwtToken');
    window.location.href = '/pages/login.html';
}
function crearTarjetaEventoHTML(evento, vista = 'busqueda') {
    // 1. NORMALIZAR EL OBJETO EVENTO
    // Para manejar tanto eventos de la IA como los guardados que podrían tener nombres diferentes.
    // Usamos el estado del backend como la fuente de verdad.
    const esActivo = (evento.eveEstado || evento.eventoEstado || evento.eventoComuEstado || '').toLowerCase() === 'activo';
    const titulo = evento.eveTitulo || evento.eventoTitulo || evento.eventoComuTitulo || 'Título no disponible';
    const descripcion = evento.eveDescripcion || evento.eventoDescripcion || evento.eventoComuDescripcion || 'Descripción no disponible';
    const enlace = evento.eveEnlace || evento.eventoEnlace || evento.eventoComuEnlace;
    const fechaInicio = evento.eveFechaInicio || evento.eventoFechaInicio || evento.eventoComuFechaInicio;
    const fechaFin = evento.eveFechaFin || evento.eventoFechaFin || evento.eventoComuFechaFin;
    const ubicacion = evento.eveUbicacion || evento.eventoUbicacion || evento.eventoComuUbicacion;
    const categoria = evento.eveCategoria || evento.eventoCategoria || 'General'; // Asumimos General si no viene
    const id = evento.eveId || evento.evento?.eveId || evento.eventoComuId;
    const eveGuaId = evento.eveGuaId;

    // 2. LÓGICA INTELIGENTE PARA LOS BOTONES
    const botonEnlaceHTML = esActivo
        ? `<a href="${enlace}" target="_blank" rel="noopener noreferrer" class="event-link btn btn-primary mt-2">
               <i class="bi bi-link-45deg"></i> Ver evento
           </a>`
        : `<button class="btn btn-secondary mt-2" disabled title="El evento ya pasó o el enlace no está disponible">
               <i class="bi bi-slash-circle"></i> No disponible
           </button>`;

    // NOTA: La lógica para el botón "Guardar" podría variar dependiendo de la vista.
    // Por ahora, la incluimos aquí, pero se podría pasar como un parámetro si se vuelve más compleja.
    let botonGuardadoHTML = '';

    if (vista === 'guardados') {
        // En la vista de "Mis Eventos", creamos el botón "Quitar".
        // Añadimos 'data-guardado-id' para el DELETE y 'data-evento-id' para actualizar nuestro array local.
        botonGuardadoHTML = `
            <button class="btn btn-danger mt-2 quitar-evento-btn" 
                    data-guardado-id="${eveGuaId}" 
                    data-evento-id="${id}">
                <i class="bi bi-bookmark-x-fill"></i> Quitar
            </button>`;
    } else {
        // En "Búsqueda" o "Historial", comprobamos si el ID está en nuestra lista
        const estaGuardado = eventosGuardadosIds.includes(id);

        if (estaGuardado) {
            botonGuardadoHTML = `
                <div class="mt-2 text-success">
                    <i class="bi bi-bookmark-check-fill"></i> Guardado
                </div>`;
        } else {
            botonGuardadoHTML = `
                <button class="btn btn-success mt-2 guardar-evento-btn" data-id="${id}">
                    <i class="bi bi-bookmark-plus"></i> Guardar
                </button>`;
        }
    }
    
    // 3. CONSTRUIR Y DEVOLVER LA PLANTILLA HTML COMPLETA
    return `
        <div class="col-12 col-md-6 col-lg-4 mb-4">
            <div class="event-card h-100">
                <div class="event-body card-body d-flex flex-column">
                    <h3 class="event-title card-title">${titulo}</h3>
                    <p class="event-description card-text">${descripcion}</p>
                    
                    <div class="event-details mt-auto">
                        <div class="detail-item"><i class="bi bi-calendar"></i><span>${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}</span></div>
                        <div class="detail-item"><i class="bi bi-geo-alt"></i><span>${ubicacion}</span></div>
                        <div class="detail-item"><i class="bi bi-bookmarks"></i><span>${categoria}</span></div>
                    </div>
                    
                    <div class="event-actions mt-3">
                        ${botonEnlaceHTML}
                        ${botonGuardadoHTML}
                        <button class="btn btn-info mt-2 compartir-evento-btn" data-id="${id}" data-medio="whatsapp"><i class="bi bi-whatsapp"></i></button>
                        <button class="btn btn-info mt-2 compartir-evento-btn" data-id="${id}" data-medio="gmail"><i class="bi bi-envelope-fill"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
async function quitarEventoGuardado(eveGuaId, eventoId, button) {
    if (!confirm("¿Estás seguro de que deseas quitar este evento de tus guardados?")) {
        return; // El usuario canceló la acción
    }

    const headers = getAuthHeaders();
    if (!headers) return; // Si no hay token, no hacer nada.

    // Deshabilitar el botón para evitar clics repetidos
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-hourglass-split"></i> Quitando...';

    try {
        const response = await fetch(`http://localhost:8080/project-AI/eventoGuardadoE/${eveGuaId}`, {
            method: "DELETE",
            headers: headers
        });

        if (response.ok) {
            // 1. Quitar la tarjeta del evento de la vista
            button.closest('.col-12').remove();

            // 2. Actualizar nuestro estado local (el array de IDs) para consistencia
            eventosGuardadosIds = eventosGuardadosIds.filter(id => id !== eventoId);
            
            alert("Evento quitado exitosamente.");
        } else {
            throw new Error('No se pudo quitar el evento.');
        }

    } catch (error) {
        console.error("Error al quitar evento:", error);
        alert(error.message);
        // Volver a habilitar el botón si falla
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-bookmark-x-fill"></i> Quitar';
    }
}

async function buscarEventos() {
    // 1. OBTENER ELEMENTOS DEL DOM Y VALIDAR ENTRADAS
    const consulta = document.getElementById("consulta").value.trim();
    const resultsContainer = document.getElementById("resultsContainer");
    const loading = document.getElementById("loading");
    const errorMessage = document.getElementById("error-message");

    // Reiniciar la interfaz de usuario para una nueva búsqueda
    resultsContainer.innerHTML = "";
    errorMessage.classList.add("d-none");
    loading.classList.remove("d-none");

    if (!consulta) {
        errorMessage.textContent = "Por favor, ingrese un tema para buscar eventos.";
        errorMessage.classList.remove("d-none");
        loading.classList.add("d-none");
        return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
        alert("Necesitas iniciar sesión para buscar.");
        return;
    }

    // 2. REALIZAR LA PETICIÓN (FETCH) AL BACKEND
    try {
        const response = await fetch("http://localhost:8080/project-AI/buscar", {
           method: "POST",
            headers: headers,
            body: JSON.stringify({ consulta })
        });

        const data = await response.json();

        // Manejo de errores de la respuesta (ej. 400, 500)
        if (!response.ok) {
            throw new Error(data.error || "Ocurrió un error al buscar. Intenta de nuevo.");
        }
        
        // Ocultar el spinner de carga
        loading.classList.add("d-none");

        // 3. RENDERIZAR LOS RESULTADOS O UN MENSAJE DE "NO ENCONTRADO"
        if (!Array.isArray(data) || data.length === 0) {
            errorMessage.textContent = "No se encontraron eventos para esta búsqueda.";
            errorMessage.classList.remove("d-none");
            return;
        }

        resultsContainer.innerHTML = `
    <div class="row">
        ${data.map(evento => crearTarjetaEventoHTML(evento, 'busqueda')).join('')}
    </div>
`;

        // 4. AÑADIR "EVENT LISTENERS" A LOS BOTONES NUEVOS
        document.querySelectorAll(".guardar-evento-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const eventoId = e.currentTarget.getAttribute("data-id");
                await guardarEvento(eventoId, e.currentTarget);
            });
        });

        document.querySelectorAll(".compartir-evento-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const eventoId = e.currentTarget.getAttribute("data-id");
                const medio = e.currentTarget.getAttribute("data-medio");
                await compartirEvento(eventoId, medio);
            });
        });

    // 5. MANEJO DE ERRORES GENERALES (ej. problemas de red)
    } catch (error) {
        console.error("Error en buscarEventos:", error);
        loading.classList.add("d-none");
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("d-none");
    }
}

async function compartirEvento(eventoId, medio) {
    const headers = getAuthHeaders();
    if (!headers) return; // Si no hay token, no hacer nada.

    try {
        const response = await fetch("http://localhost:8080/project-AI/compartir", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                evento: {
                    eveId: parseInt(eventoId)
                },
                eveCompMedio: medio
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al compartir el evento");
        }

        const resultado = await response.json();
        alert("✅ Evento compartido exitosamente");
        console.log("Evento compartido:", resultado);

        // Abrir enlace dependiendo del medio
        const titulo = encodeURIComponent(resultado.eveTitulo || "Evento");
        const enlace = encodeURIComponent(resultado.eveEnlace || "http://localhost:8080/");
        const mensaje = encodeURIComponent(`¡Hola! Te comparto este evento: ${titulo}. Puedes verlo aquí: ${enlace}`);

        // Copiar enlace al portapapeles
        navigator.clipboard.writeText(decodeURIComponent(enlace))
        .then(() => {
        console.log("Enlace copiado al portapapeles:", decodeURIComponent(enlace));
        })
        .catch(err => {
        console.warn("No se pudo copiar el enlace al portapapeles:", err);
        });
        if (medio === "whatsapp") {
            window.open(`https://wa.me/?text=${mensaje}`, "_blank");
        } else if (medio === "gmail") {
            const asunto = encodeURIComponent(`Te comparto un evento: ${titulo}`);
            window.open(`mailto:?subject=${asunto}&body=${mensaje}`, "_blank");
        }

    } catch (error) {
        console.error("Error al compartir evento:", error);
        alert("❌ No se pudo compartir el evento");
    }
}


async function guardarEvento(eventoId, button) {
     const headers = getAuthHeaders();
    if (!headers) return; // Si no hay token, no hacer nada.

    // Desactiva el botón para evitar múltiples clics
    button.disabled = true;
    button.textContent = "Guardando...";

    const body = {
        evento: { eveId: parseInt(eventoId) }
    };

    try {
        const response = await fetch("http://localhost:8080/project-AI/eventoGuardadoAG", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (response.ok) {
            alert("Evento guardado exitosamente.");
             // 1. Actualizar el estado local
        const idNumerico = parseInt(eventoId);
        if (!eventosGuardadosIds.includes(idNumerico)) {
            eventosGuardadosIds.push(idNumerico);
        }

        // 2. Actualizar la UI del botón específico
        button.outerHTML = `
            <div class="mt-2 text-success">
                <i class="bi bi-bookmark-check-fill"></i> Guardado
            </div>`;
        } else if (response.status === 406) {
            alert("El evento ya está guardado.");
            button.textContent = "Ya guardado";
        } else {
            alert("No se pudo guardar el evento, ya esta guardado.");
            button.textContent = "Reintentar";
            button.disabled = false;
        }
    } catch (error) {
        console.error("Error al guardar evento:", error);
        alert("Error al guardar evento.");
        button.textContent = "Error";
        button.disabled = false;
    }
}


async function obtenerEventosPorUsuario() {
    const resultsContainer = document.getElementById("resultsContainer");
    const loading = document.getElementById("loading");
    const errorMessage = document.getElementById("error-message");

    resultsContainer.innerHTML = "";
    errorMessage.classList.add("d-none");
    loading.classList.remove("d-none");

     const headers = getAuthHeaders();
    if (!headers) return; 
    try {
       
        const response = await fetch(`http://localhost:8080/project-AI/eventoGuardadoUsuario`, {
             method: "GET",
             headers: headers
        });

        if (!response.ok) {
            throw new Error("Error al obtener los eventos guardados.");
        }

        const eventos = await response.json();
        loading.classList.add("d-none");

        if (!Array.isArray(eventos) || eventos.length === 0) {
            errorMessage.textContent = "No tienes eventos guardados.";
            errorMessage.classList.remove("d-none");
            return;
        }

        // ¡MIRA QUÉ LIMPIO QUEDA AHORA!
        resultsContainer.innerHTML = `
            <div class="row">
                ${eventos.map(evento => crearTarjetaEventoHTML(evento, 'guardados')).join('')}
            </div>
        `;
         document.querySelectorAll(".quitar-evento-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const botonPresionado = e.currentTarget;
                const eveGuaId = botonPresionado.dataset.guardadoId; // 'data-guardado-id'
                const eventoId = parseInt(botonPresionado.dataset.eventoId); // 'data-evento-id'
                
                quitarEventoGuardado(eveGuaId, eventoId, botonPresionado);
            });
        });
        // Asigna funcionalidad a los botones de compartir
        document.querySelectorAll(".compartir-evento-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const eventoId = e.currentTarget.getAttribute("data-id");
                const medio = e.currentTarget.getAttribute("data-medio");
                await compartirEvento(eventoId, medio);
            });
        });
        

    } catch (error) {
        console.error("Error al obtener eventos del usuario:", error);
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("d-none");
        loading.classList.add("d-none");
    }
}

async function HistorialPorUsuario() {
    const resultsContainer = document.getElementById("resultsContainer");
    const loading = document.getElementById("loading");
    const errorMessage = document.getElementById("error-message");

    document.getElementById("btnBorrarHistorial").classList.add("d-none");

    resultsContainer.innerHTML = "";
    errorMessage.classList.add("d-none");
    loading.classList.remove("d-none");

    const headers = getAuthHeaders();
    if (!headers) {
        // Manejar el caso de que no haya sesión
        alert("Necesitas iniciar sesión para ver tu historial.");
        cerrarSesion();
        return; 
    }
    try {
        const response = await fetch("http://localhost:8080/project-AI/eventosU", {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error("Sesión expirada. Inicie sesión nuevamente.");
            if (response.status === 404) throw new Error("Usuario no encontrado.");
            throw new Error("Error al obtener los eventos.");
        }

        const eventos = await response.json();
        loading.classList.add("d-none");

        if (!Array.isArray(eventos) || eventos.length === 0) {
            errorMessage.textContent = "No hay eventos asociados a este usuario.";
            errorMessage.classList.remove("d-none");
            return;
        }

        document.getElementById("btnBorrarHistorial").classList.remove("d-none");

        resultsContainer.innerHTML = `
            <div class="row">
                ${eventos.map(evento => crearTarjetaEventoHTML(evento, 'historial')).join('')}
            </div>
        `;
        document.querySelectorAll(".guardar-evento-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const eventoId = e.currentTarget.getAttribute("data-id");
                await guardarEvento(eventoId, e.currentTarget); // <- se pasa el botón
            });
        });        
        document.querySelectorAll(".compartir-evento-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const eventoId = e.currentTarget.getAttribute("data-id");
                const medio = e.currentTarget.getAttribute("data-medio");
                await compartirEvento(eventoId, medio);
            });
        });                   
    } catch (error) {
        console.error("Error al obtener eventos del usuario:", error);
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("d-none");
        loading.classList.add("d-none");
    }
}

function formatearFecha(fecha) {
    if (!fecha) return "Fecha no disponible";
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function eliminarHistorial() {
    if (!confirm("¿Estás seguro de que deseas borrar tu historial de búsqueda? Esta acción no se puede deshacer.")) {
        return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
        alert("Necesitas iniciar sesión.");
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/project-AI/historial", {
            method: "DELETE",
            headers: headers
        });

        // ==================================================================
        // AQUÍ ESTÁ LA NUEVA LÓGICA
        // ==================================================================
        // Primero, verificamos si la sesión expiró (error 401).
        if (response.status === 401) {
            alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
            cerrarSesion(); // Llamamos a tu función de logout para limpiar y redirigir.
            return; // Detenemos la ejecución de la función aquí.
        }

        // Si la respuesta no fue 401, pero tampoco fue exitosa, manejamos otros errores.
        if (!response.ok) {
            // Intenta obtener un mensaje de error del backend, si no, usa uno genérico.
            const errorData = await response.json().catch(() => ({})); 
            throw new Error(errorData.message || "Error al eliminar el historial.");
        }

        // Si todo fue exitoso (response.ok es true)
        alert("Historial eliminado correctamente");
        await HistorialPorUsuario(); // Recargamos la vista del historial (que ahora estará vacía).
        
    } catch (error) {
        console.error("Error al eliminar historial:", error);
        // Evitamos mostrar la alerta si ya lo hicimos por el error 401
        if (error.message.includes("expirado")) {
            // No hacemos nada, ya se manejó.
        } else {
            alert(error.message || "Hubo un error de red al borrar el historial.");
        }
    }
}

// Ajuste dinámico del padding-top para el navbar
function adjustBodyPadding() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const navbarHeight = navbar.offsetHeight;
        document.body.style.paddingTop = navbarHeight + 10 + 'px';
    }
}

// Scroll horizontal para filtros
const filterContainer = document.querySelector('.filter-container');
if (filterContainer) {
    let isDown = false;
    let startX;
    let scrollLeft;

    filterContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - filterContainer.offsetLeft;
        scrollLeft = filterContainer.scrollLeft;
    });

    filterContainer.addEventListener('mouseleave', () => {
        isDown = false;
    });

    filterContainer.addEventListener('mouseup', () => {
        isDown = false;
    });

    filterContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - filterContainer.offsetLeft;
        const walk = (x - startX) * 2;
        filterContainer.scrollLeft = scrollLeft - walk;
    });
}

// Filtros de categoría
const filterButtons = document.querySelectorAll('.filter-btn');
const inputBusqueda = document.getElementById('consulta');
const toggleCategorias = document.getElementById('toggleCategorias');
const contenedorCategorias = document.querySelector('.collapse-categorias');

// Mostrar/ocultar categorías con animación
toggleCategorias.addEventListener('click', () => {
    contenedorCategorias.classList.toggle('show');
});

// Filtro con control de selección única
filterButtons.forEach(button => {
    button.addEventListener('click', function () {
        const isActive = this.classList.contains('active');

        // Desactivar todos los botones
        filterButtons.forEach(btn => btn.classList.remove('active'));

        if (!isActive) {
            // Activar botón actual y poner su texto en el input
            this.classList.add('active');
            inputBusqueda.value = this.textContent.trim();
            inputBusqueda.disabled = true; // Bloquear escritura
        } else {
            inputBusqueda.value = '';
            inputBusqueda.disabled = false; // Permitir escritura
        }
    });
});

// Si el usuario borra manualmente (por si desbloquea), desactiva categorías
inputBusqueda.addEventListener('input', () => {
    if (inputBusqueda.value.trim() === '') {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        inputBusqueda.disabled = false;
    }
});

// Escucha cambios en el input de búsqueda
inputBusqueda.addEventListener('input', () => {
    // Si el usuario borra manualmente, también desactiva todos los botones
    if (inputBusqueda.value.trim() === '') {
        filterButtons.forEach(btn => btn.classList.remove('active'));
    }
});


// Ejecutar al cargar y al cambiar el tamaño
window.addEventListener('load', adjustBodyPadding);
window.addEventListener('resize', adjustBodyPadding);