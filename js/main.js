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
    try {
        const token = localStorage.getItem("jwtToken");
        if (!token || !token.startsWith("Bearer ")) {
            throw new Error("No hay token disponible o es inválido");
        }

        const response = await fetch("http://localhost:8080/project-AI/usuarios/auth", {
            method: "GET",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
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
    try {
        const token = localStorage.getItem("jwtToken");
        if (!token || !token.startsWith("Bearer ")) return;

        const response = await fetch(`http://localhost:8080/project-AI/eventoGuardadoUsuario`, {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("No se pudieron obtener los eventos guardados");

        const eventos = await response.json();
        console.log("Eventos recibidos:", eventos);
        eventosGuardadosIds = eventos.map(e => ({
            id: e.eveId,
            titulo: e.eveTitulo
        }));
    } catch (error) {
        console.error("Error al obtener IDs de eventos guardados:", error);
    }
}


function cerrarSesion() {
    localStorage.removeItem('jwtToken');
    window.location.href = '/pages/login.html';
}

async function buscarEventos() {
    const consulta = document.getElementById("consulta").value.trim();
    const resultsContainer = document.getElementById("resultsContainer");
    const loading = document.getElementById("loading");
    const errorMessage = document.getElementById("error-message");

    resultsContainer.innerHTML = "";
    errorMessage.classList.add("d-none");
    loading.classList.remove("d-none");

    if (!consulta) {
        errorMessage.textContent = "Por favor, ingrese un tema para buscar eventos.";
        errorMessage.classList.remove("d-none");
        loading.classList.add("d-none");
        return;
    }

    let token = localStorage.getItem("jwtToken");
    if (!token) {
        errorMessage.textContent = "No tienes sesión iniciada.";
        errorMessage.classList.remove("d-none");
        loading.classList.add("d-none");
        return;
    }

    if (!token.startsWith("Bearer ")) {
        token = `Bearer ${token}`;
    }

    try {
        const response = await fetch("http://localhost:8080/project-AI/buscar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({
                consulta,
                usuId: usuarioGlobal ? usuarioGlobal.usuId : null
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error al obtener eventos");
        }

        setTimeout(() => {
            loading.classList.add("d-none");

            if (!Array.isArray(data) || data.length === 0) {
                errorMessage.textContent = "No se encontraron eventos.";
                errorMessage.classList.remove("d-none");
                return;
            }

            resultsContainer.innerHTML = `
                <div class="row">
                    ${data.map(evento => `
                        <div class="col-12 col-md-6 col-lg-4 mb-4">
                            <div class="event-card h-100">
                                <div class="event-body card-body">
                                    <h3 class="event-title card-title">${evento.eveTitulo}</h3>
                                    <p class="event-description card-text">${evento.eveDescripcion || 'Descripción no disponible'}</p>
                                    
                                    <div class="event-details">
                                        <div class="detail-item">
                                            <i class="bi bi-calendar"></i>
                                            <span>${formatearFecha(evento.eveFechaInicio)} - ${formatearFecha(evento.eveFechaFin)}</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="bi bi-geo-alt"></i>
                                            <span>${evento.eveUbicacion || "Ubicación no disponible"}</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="bi bi-bookmarks"></i>
                                            <span>${evento.eveCategoria || "Categoria no disponible"}</span>
                                        </div>
                                    </div>
                                    
                                    ${evento.eveEnlace ? `
                                    <a href="${evento.eveEnlace}" target="_blank" rel="noopener noreferrer" class="event-link btn btn-primary mt-2">
                                        <i class="bi bi-link-45deg"></i> Ver evento
                                    </a>
                                    ` : ''}
                                    ${!eventosGuardadosIds.includes(evento.eveId) ? `
                                    <button class="btn btn-success mt-2 guardar-evento-btn" data-id="${evento.eveId}">
                                        <i class="bi bi-bookmark-plus"></i> Guardar
                                    </button>
                                    ` : `
                                    <div class="mt-2 text-success">
                                        <i class="bi bi-bookmark-check-fill"></i> Ya guardado
                                    </div>
                                    `}
                                    <button class="btn btn-info mt-2 compartir-evento-btn" data-id="${evento.eveId}" data-medio="whatsapp">
                                        <i class="bi bi-share-fill"></i> Compartir por WhatsApp
                                    </button>
                                    <button class="btn btn-info mt-2 compartir-evento-btn" data-id="${evento.eveId}" data-medio="gmail">
                                        <i class="bi bi-share-fill"></i> Compartir por Gmail
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
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
        }, 500);
    } catch (error) {
        console.error("Error al obtener eventos:", error);
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("d-none");
        loading.classList.add("d-none");
    }
    
}

async function compartirEvento(eventoId, medio) {
    const token = localStorage.getItem("jwtToken");
    if (!token || !token.startsWith("Bearer ")) {
        alert("Usuario no autenticado");
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/project-AI/compartir", {
            method: "POST",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            },
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
    const token = localStorage.getItem("jwtToken");
    if (!token || !token.startsWith("Bearer ")) {
        alert("Usuario no autenticado");
        return;
    }

    // Desactiva el botón para evitar múltiples clics
    button.disabled = true;
    button.textContent = "Guardando...";

    const body = {
        evento: { eveId: parseInt(eventoId) }
    };

    try {
        const response = await fetch("http://localhost:8080/project-AI/eventoGuardadoAG", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            alert("Evento guardado exitosamente.");
            button.textContent = "Guardado";
            eventosGuardadosIds.push(parseInt(eventoId));
        } else if (response.status === 406) {
            alert("El evento ya está guardado.");
            button.textContent = "Ya guardado";
        } else {
            alert("No se pudo guardar el evento.");
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

    try {
        const token = localStorage.getItem("jwtToken");
        if (!token || !token.startsWith("Bearer ")) {
            throw new Error("No hay token disponible o es inválido");
        }

        const response = await fetch(`http://localhost:8080/project-AI/eventoGuardadoUsuario`, {
            method: "GET",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
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

        resultsContainer.innerHTML = `
            <div class="row">
            ${eventos.map(evento => {
                const esEventoIA = evento.eventoTitulo !== null; // Si tiene titulo general
                const titulo = esEventoIA ? evento.eventoTitulo : evento.eventoComuTitulo;
                const descripcion = esEventoIA ? evento.eventoDescripcion : evento.eventoComuDescripcion;
                const ubicacion = esEventoIA ? evento.eventoUbicacion : evento.eventoComuUbicacion;
                const fechaInicio = esEventoIA ? evento.eventoFechaInicio : evento.eventoComuFechaInicio;
                const fechaFin = esEventoIA ? evento.eventoFechaFin : evento.eventoComuFechaFin;
                const categoria = esEventoIA ? evento.eventoCategoria : evento.eventoCategoria;
                const enlace = esEventoIA ? evento.eventoEnlace : evento.eventoComuEnlace;
            
                return `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
                    <div class="event-card h-100">  
                        <div class="event-body card-body">
                            <h3 class="event-title card-title">${titulo}</h3>
                            <p class="event-description card-text">${descripcion || 'Descripción no disponible'}</p>
                            
                            <div class="event-details">
                                <div class="detail-item">
                                    <i class="bi bi-calendar"></i>
                                    <span>${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="bi bi-geo-alt"></i>
                                    <span>${ubicacion || "Ubicación no disponible"}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="bi bi-bookmarks"></i>
                                    <span>${categoria || "Categoría no disponible"}</span>
                                </div>
                            </div>
                            
                            ${enlace ? `
                            <a href="${enlace}" target="_blank" rel="noopener noreferrer" class="event-link btn btn-primary mt-2">
                                <i class="bi bi-link-45deg"></i> Ver evento
                            </a>` : ''}
            
                            <button class="btn btn-info mt-2 compartir-evento-btn" data-id="${evento.eveId || evento.eventoComuId}" data-medio="whatsapp">
                                <i class="bi bi-share-fill"></i> Compartir por WhatsApp
                            </button>
                            <button class="btn btn-info mt-2 compartir-evento-btn" data-id="${evento.eveId || evento.eventoComuId}" data-medio="gmail">
                                <i class="bi bi-share-fill"></i> Compartir por Gmail
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('')}            
            </div>
        `;
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

    try {
        const token = localStorage.getItem("jwtToken");
        if (!token || !token.startsWith("Bearer ")) {
            throw new Error("No hay token disponible o es inválido");
        }

        const response = await fetch("http://localhost:8080/project-AI/eventosU", {
            method: "GET",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
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
                ${eventos.map(evento => `
                    <div class="col-12 col-md-6 col-lg-4 mb-4">
                        <div class="event-card h-100">  
                            <div class="event-body card-body">
                                <h3 class="event-title card-title">${evento.eveTitulo}</h3>
                                <p class="event-description card-text">${evento.eveDescripcion || 'Descripción no disponible'}</p>
                                
                                <div class="event-details">
                                    <div class="detail-item">
                                        <i class="bi bi-calendar"></i>
                                        <span>${formatearFecha(evento.eveFechaInicio)} - ${formatearFecha(evento.eveFechaFin)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <i class="bi bi-geo-alt"></i>
                                        <span>${evento.eveUbicacion || "Ubicación no disponible"}</span>
                                    </div>
                                    <div class="detail-item">
                                        <i class="bi bi-bookmarks"></i>
                                        <span>${evento.eveCategoria || "Categoria no disponible"}</span>
                                    </div>
                                </div>
                                
                                ${evento.eveEnlace ? `
                                <a href="${evento.eveEnlace}" target="_blank" rel="noopener noreferrer" class="event-link btn btn-primary mt-2">
                                    <i class="bi bi-link-45deg"></i> Ver evento
                                </a>
                                ` : ''}
                                
                                <div class="event-status mt-2">
                                    <span class="badge ${evento.eveEstado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
                                        ${evento.eveEstado}
                                    </span>
                                </div>

                                ${!eventosGuardadosIds.includes(evento.eveId) ? `
                                    <button class="btn btn-success mt-2 guardar-evento-btn" data-id="${evento.eveId}">
                                        <i class="bi bi-bookmark-plus"></i> Guardar
                                    </button>
                                    ` : `
                                    <div class="mt-2 text-success">
                                        <i class="bi bi-bookmark-check-fill"></i> Ya guardado
                                    </div>
                                    `}
                                    <button class="btn btn-info mt-2 compartir-evento-btn" data-id="${evento.eveId}" data-medio="whatsapp">
                                        <i class="bi bi-share-fill"></i> Compartir por WhatsApp
                                    </button>
                                    <button class="btn btn-info mt-2 compartir-evento-btn" data-id="${evento.eveId}" data-medio="gmail">
                                        <i class="bi bi-share-fill"></i> Compartir por Gmail
                                    </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
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
    try {
        const token = localStorage.getItem("jwtToken");
        if (!token || !token.startsWith("Bearer ")) {
            throw new Error("No hay token disponible o es inválido");
        }

        const response = await fetch("http://localhost:8080/project-AI/historial", {
            method: "DELETE",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            alert("Historial eliminado correctamente");
            obtenerEventosPorUsuario();
            document.getElementById("resultsContainer").innerHTML = ""; // limpiar el contenedor
            btn.classList.add("d-none");
        } else {
            alert("Error al eliminar el historial");
        }
    } catch (error) {
        console.error("Error al eliminar historial:", error);
        alert("Hubo un error al borrar el historial.");
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