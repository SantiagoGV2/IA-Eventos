// nueva-password.js

function toggleVisibility(toggleElementId, inputElementId) {
  const toggle = document.getElementById(toggleElementId);
  const input = document.getElementById(inputElementId);
  if (!toggle || !input) return;
  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.classList.toggle('bi-eye-slash', !isPassword);
    toggle.classList.toggle('bi-eye', isPassword);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newPasswordForm');
  const API_BASE_URL = 'http://localhost:8080/project-AI/auth/recovery';

  toggleVisibility('toggleNewPassword', 'newPassword');
  toggleVisibility('toggleConfirmNewPassword', 'confirmNewPassword');

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = (document.getElementById('newPassword')?.value || '').trim();
    const confirm = (document.getElementById('confirmNewPassword')?.value || '').trim();

    if (password.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Contraseña muy corta', text: 'Debe tener al menos 8 caracteres.' });
      return;
    }
    if (password !== confirm) {
      Swal.fire({ icon: 'warning', title: 'Las contraseñas no coinciden' });
      return;
    }

    try {
      // --- INICIO DE LA INTEGRACIÓN CON BACKEND ---
      // ¡Paso clave! Obtenemos el token guardado.
      const token = localStorage.getItem('resetToken');

      if (!token) {
          Swal.fire({ icon: 'error', title: 'Sesión inválida', text: 'No se encontró un token. Por favor, inicia el proceso de nuevo.' });
          return;
      }

      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, newPassword: password })
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.message || 'No se pudo actualizar la contraseña.');
      }

      // Limpiamos el token después de usarlo. ¡Importante por seguridad!
      localStorage.removeItem('resetToken');
      // --- FIN DE LA INTEGRACIÓN CON BACKEND ---

      Swal.fire({ icon: 'success', title: 'Contraseña actualizada', timer: 1600, showConfirmButton: false });
      
      setTimeout(() => {
        const url = new URL(window.location.href);
        const base = url.pathname.replace(/nueva-password\.html$/, 'login.html');
        window.location.href = base;
      }, 900);

    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  });
});