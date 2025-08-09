document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("btnLogout").addEventListener("click", cerrarSesion);
  await obtenerUsuario();
});

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

function obtenerIniciales(nombreCompleto) {
  if (!nombreCompleto) return "??";
  const palabras = nombreCompleto.trim().split(" ");
  if (palabras.length === 1) {
    return palabras[0].substring(0, 2).toUpperCase();
  }
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

let usuarioGlobal = null;

function getAuthHeaders() {
    // Usar el nuevo sistema de autenticación seguro
    return window.authSecurity.getAuthHeaders();
}
async function obtenerUsuario() {
  const headers = getAuthHeaders();
    if (!headers) {
        cerrarSesion(); // Si no hay token, no podemos continuar.
        return;
    }
  try {
    const response = await fetch(window.authSecurity.getApiUrl("/admin/auth"), {
      method: "GET",
      headers: headers
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Sesión expirada, inicie sesión nuevamente");
      throw new Error("Error al obtener usuario");
    }

    usuarioGlobal = await response.json();
    console.log("Usuario autenticado:", usuarioGlobal);
    document.getElementById("usuario-info").textContent = `Bienvenido, ${usuarioGlobal.admNombre}`;
    const iniciales = obtenerIniciales(usuarioGlobal.admNombre);
    document.getElementById("user-avatar").textContent = iniciales;
    document.getElementById("btnLogout").classList.remove("d-none");

  } catch (error) {
    console.error("Error al obtener usuario:", error);
        await Swal.fire({
            icon: 'error',
            title: 'Sesión inválida',
            text: error.message,
            confirmButtonText: 'Ir a Login'
          });
        window.authSecurity.clearToken();
        window.authSecurity.redirectToLogin(error.message);
    }
}

function cerrarSesion() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Tu sesión actual se cerrará.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await window.authSecurity.logout();
        }
    });
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

  document.addEventListener('DOMContentLoaded', function() {
            // Mostrar/ocultar contraseña
            const togglePassword = document.getElementById('togglePassword');
            const password = document.getElementById('loginPassword');
            
            if (togglePassword && password) {
                togglePassword.addEventListener('click', function() {
                    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
                    password.setAttribute('type', type);
                    this.classList.toggle('bi-eye');
                    this.classList.toggle('bi-eye-slash');
                });
            }
        });