let eventosGuardadosIds = [];
//Panel usuario
document.getElementById('user-avatar').addEventListener('click', function (e) {
  e.stopPropagation();
  document.getElementById('userPanel').classList.toggle('active');
});

// Cerrar el panel al hacer clic fuera
document.addEventListener('click', function (e) {
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

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("btnLogout").addEventListener("click", cerrarSesion);
  await obtenerUsuario();
  await fetchEvento();
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

}

function cerrarSesion() {
  localStorage.removeItem('jwtToken');
  window.location.href = '/pages/login.html';
}

async function compartirEvento(eventoId, medio) {
  const headers = getAuthHeaders();
    if (!headers) return; // Si no hay token, no hacer nada.

  try {
    const response = await fetch("http://localhost:8080/project-AI/compartir", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        eventosComunidad: {
          eveComuId: parseInt(eventoId)
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
    const titulo = encodeURIComponent(resultado.eveComuTitulo || "Evento");
    const enlace = encodeURIComponent(resultado.eveComuEnlace || "http://localhost:8080/");
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
    eventosComunidad: { eveComuId: parseInt(eventoId) }
  };

  try {
    const response = await fetch("http://localhost:8080/project-AI/eventoGuardadoAG", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });

    if (response.ok) {
      eventosGuardadosIds.push(parseInt(eventoId)); // <-- Agregar a la lista
      alert("Evento guardado exitosamente.");
      button.textContent = "Guardado";
    }
     else if (response.status === 406) {
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
function construirTarjetaEvento(evento) {
  const fechaInicio = new Date(evento.eveComuFechaInicio);
  const fechaFin = new Date(evento.eveComuFechaFin);
  const fechaPublicacion = new Date(evento.eveComuFechaCreacion || evento.eveComuFechaInicio);

  const card = document.createElement('div');
  card.className = 'col-12 col-md-6 col-lg-4 mb-4';
  card.innerHTML = `
  <div class="event-card h-100 d-flex flex-column">
    <div class="creator-header d-flex align-items-center p-3 border-bottom bg-light">
      <div>
        <h6 class="mb-0">${evento.creadorNombre || 'Usuario'}</h6>
        <small class="text-muted">Publicado ${fechaPublicacion.toLocaleDateString('es-ES')}</small>
      </div>
    </div>

    <div class="event-body card-body flex-grow-1 d-flex flex-column">
      <h3 class="event-title card-title">${evento.eveComuTitulo}</h3>
      <p class="event-description card-text">${evento.eveComuDescripcion || 'Descripción no disponible'}</p>

      <div class="event-details mb-3">
        <div class="detail-item mb-1">
          <i class="bi bi-calendar"></i> 
          <span>${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}</span>
        </div>
        <div class="detail-item mb-1">
          <i class="bi bi-geo-alt"></i> 
          <span>${evento.eveComuUbicacion || "Ubicación no disponible"}</span>
        </div>
        <div class="detail-item mb-1">
          <i class="bi bi-bookmarks"></i> 
          <span>${evento.eveComuCategoria || "Categoría no disponible"}</span>
        </div>
      </div>

      ${evento.eveComuEnlace ? `
        <a href="${evento.eveComuEnlace}" target="_blank" rel="noopener noreferrer" class="event-link btn btn-primary mb-2">
          <i class="bi bi-link-45deg"></i> Ver evento
        </a>
      ` : ''}

      <div class="event-status mb-2">
        <span class="badge ${evento.eveComuEstado === 'activo' ? 'bg-success' : 'bg-secondary'}">
          ${evento.eveComuEstado}
        </span>
      </div>

      ${!eventosGuardadosIds.some(e => e.id === evento.eveComuId) ? `
        <button class="btn btn-success mb-2 guardar-evento-btn" data-id="${evento.eveComuId}">
          <i class="bi bi-bookmark-plus"></i> Guardar
        </button>
      ` : `
        <div class="mb-2 text-success">
          <i class="bi bi-bookmark-check-fill"></i> Ya guardado
        </div>
      `}

      <button class="btn btn-info mb-2 compartir-evento-btn" data-id="${evento.eveComuId}" data-medio="whatsapp">
        <i class="bi bi-share-fill"></i> Compartir por WhatsApp
      </button>
      <button class="btn btn-info compartir-evento-btn" data-id="${evento.eveComuId}" data-medio="gmail">
        <i class="bi bi-share-fill"></i> Compartir por Gmail
      </button>
    </div>
  </div>
`;


  // Listeners
  const guardarBtn = card.querySelector(".guardar-evento-btn");
  if (guardarBtn) {
    guardarBtn.addEventListener("click", async (e) => {
      const eventoId = e.currentTarget.getAttribute("data-id");
      await guardarEvento(eventoId, e.currentTarget);
    });
  }

  const compartirBtns = card.querySelectorAll(".compartir-evento-btn");
  compartirBtns.forEach(button => {
    button.addEventListener("click", async (e) => {
      const eventoId = e.currentTarget.getAttribute("data-id");
      const medio = e.currentTarget.getAttribute("data-medio");
      await compartirEvento(eventoId, medio);
    });
  });

  return card;
}

const fetchEvento = async () => {
  const headers = getAuthHeaders();
    if (!headers) return; // Si no hay token, no hacer nada.

  try {
    const response = await fetch('http://localhost:8080/project-AI/eventoComuTodo', {
      method: "GET",
      headers: headers,
    });

    if (response.ok) {
      const eventos = await response.json();
      const listaEventos = document.getElementById('listaEventos');
      listaEventos.innerHTML = '';

      eventos.forEach(evento => {
        const card = construirTarjetaEvento(evento);
        listaEventos.appendChild(card);
      });

    } else {
      console.error('Error al obtener los eventos:', response.status);
    }
  } catch (error) {
    console.error('Error en la conexión:', error);
  }
};

document.getElementById("form-filtros").addEventListener("submit", async function (e) {
  e.preventDefault();
  await filtrarEventos();
});

async function filtrarEventos() {
  const titulo = document.getElementById("titulo").value.trim();
  const categoria = document.getElementById("categoria").value;
  const estado = document.getElementById("estado").value;
  const ubicacion = document.getElementById("ubicacion").value.trim();

  const params = new URLSearchParams();
  if (titulo) params.append("titulo", titulo);
  if (categoria) params.append("categoria", categoria);
  if (estado) params.append("estado", estado);
  if (ubicacion) params.append("ubicacion", ubicacion);
  const headers = getAuthHeaders();
    if (!headers) return; // Si no hay token, no hacer nada.
  try {
    const response = await fetch(`http://localhost:8080/project-AI/eventoComuFiltro?${params.toString()}`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error("Error al filtrar eventos");
    }

    const eventos = await response.json();
    renderizarEventos(eventos);
  } catch (error) {
    console.error("Error al filtrar eventos:", error);
    alert("No se pudieron obtener los eventos filtrados.");
  }
}

function renderizarEventos(eventos) {
  const listaEventos = document.getElementById('listaEventos');
  listaEventos.innerHTML = '';
  eventos.forEach(evento => {
    const card = construirTarjetaEvento(evento);
    listaEventos.appendChild(card);
  });
}



document.addEventListener("DOMContentLoaded", () => {
  filtrarEventos(); // Carga todos los eventos sin filtros
});


