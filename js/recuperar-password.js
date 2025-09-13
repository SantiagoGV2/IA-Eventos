// recuperar-password.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('recoveryRequestForm');
  const successBanner = document.getElementById('requestSuccess');
  const API_BASE_URL = 'http://localhost:8080/project-AI/auth/recovery';

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const emailInput = document.getElementById('recoveryEmail');
    const email = (emailInput?.value || '').trim();

    if (!email) {
      Swal.fire({ icon: 'warning', title: 'Ingresa tu correo', timer: 1800, showConfirmButton: false });
      return;
    }

    try {
      // --- INICIO DE LA INTEGRACIÓN CON BACKEND ---
      const response = await fetch(`${API_BASE_URL}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      if (!response.ok) {
        // Aunque el backend siempre devuelve 200 OK, es buena práctica tener esto.
        throw new Error('La solicitud al servidor falló.');
      }
      // --- FIN DE LA INTEGRACIÓN CON BACKEND ---

      successBanner && (successBanner.style.display = 'block');
      Swal.fire({
        icon: 'success',
        title: 'Código enviado',
        text: 'Revisa tu correo e ingresa el código de 6 dígitos.',
        timer: 2200,
        showConfirmButton: false,
      });

      setTimeout(() => {
        const url = new URL(window.location.href);
        const base = url.pathname.replace(/recuperar-password\.html$/, 'verificar-codigo.html');
        // Pasamos el email a la siguiente página para que el usuario sepa para qué correo es el código
        window.location.href = base + '?email=' + encodeURIComponent(email);
      }, 1200);

    } catch (error) {
      console.error('Error solicitando código:', error);
      Swal.fire({ icon: 'error', title: 'Error al solicitar código', text: 'Inténtalo nuevamente.' });
    }
  });
});