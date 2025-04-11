document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("btnLogout").addEventListener("click", cerrarSesion);
  await obtenerUsuario();
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

    const response = await fetch("http://localhost:8080/project-AI/admin/auth", {
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
    // Guardar admId en localStorage
    localStorage.setItem("admId", usuarioGlobal.admId); // <<--- AGREGAR ESTO
    document.getElementById("usuario-info").textContent = `Bienvenido, ${usuarioGlobal.admNombre}`;
    const iniciales = obtenerIniciales(usuarioGlobal.admNombre);
    document.getElementById("user-avatar").textContent = iniciales;
    document.getElementById("btnLogout").classList.remove("d-none");

  } catch (error) {
    console.error("Error al obtener usuario:", error);
    alert(error.message);
    localStorage.removeItem("jwtToken");
    window.location.href = "/admin/index.html";
  }
}

function cerrarSesion() {
  localStorage.removeItem('jwtToken');
  window.location.href = '/admin/index.html';
}


// Control del menú móvil
document.getElementById('mobileMenuBtn').addEventListener('click', function () {
  document.querySelector('.sidebar').classList.toggle('active');
});

// Cerrar menú al hacer clic en un enlace (móviles)
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', function () {
    if (window.innerWidth < 992) {
      document.querySelector('.sidebar').classList.remove('active');
    }
  });
});

// Ajustar al cambiar tamaño de pantalla
window.addEventListener('resize', function () {
  if (window.innerWidth >= 992) {
    document.querySelector('.sidebar').classList.remove('active');
  }
});

// Control del overlay
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

mobileMenuBtn.addEventListener('click', function () {
  sidebar.classList.toggle('active');
  overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
});

overlay.addEventListener('click', function () {
  sidebar.classList.remove('active');
  overlay.style.display = 'none';
});