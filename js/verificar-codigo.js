// verificar-codigo.js

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

document.addEventListener('DOMContentLoaded', () => {
  const emailField = document.getElementById('emailForCode');
  const form = document.getElementById('verifyCodeForm');
  const resendBtn = document.getElementById('resendCodeBtn');
  const API_BASE_URL = 'http://localhost:8080/project-AI/auth/recovery';

  const emailFromUrl = getQueryParam('email');
  if (emailFromUrl && emailField) {
    emailField.value = emailFromUrl;
  }

  // Lógica para verificar el código
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = (emailField?.value || '').trim();
      const codeInput = document.getElementById('verificationCode');
      const code = (codeInput?.value || '').trim();

      if (!email || !code || !/^\d{6}$/.test(code)) {
        Swal.fire({ icon: 'warning', title: 'Datos inválidos', text: 'Verifica el correo y el código (6 dígitos).' });
        return;
      }

      try {
        // --- INICIO DE LA INTEGRACIÓN CON BACKEND ---
        const response = await fetch(`${API_BASE_URL}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, code: code })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Código inválido o expirado');
        }

        // ¡Paso clave! Guardamos el token para la siguiente página.
        localStorage.setItem('resetToken', data.token);
        // --- FIN DE LA INTEGRACIÓN CON BACKEND ---

        Swal.fire({ icon: 'success', title: 'Código verificado', timer: 1500, showConfirmButton: false });

        setTimeout(() => {
          const url = new URL(window.location.href);
          const base = url.pathname.replace(/verificar-codigo\.html$/, 'nueva-password.html');
          // Ya no es necesario pasar el email, el token es nuestra autorización.
          window.location.href = base; 
        }, 900);

      } catch (error) {
        console.error('Error verificando código:', error);
        // Mostramos el mensaje de error que viene del backend.
        Swal.fire({ icon: 'error', title: 'Error', text: error.message });
      }
    });
  }

  // Lógica para reenviar el código
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const email = (emailField?.value || '').trim();
      if (!email) {
        Swal.fire({ icon: 'info', title: 'Ingresa tu correo para reenviar' });
        return;
      }
      try {
        // --- INTEGRACIÓN DE REENVÍO ---
        await fetch(`${API_BASE_URL}/request`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email: email })
        });
        // --- FIN DE INTEGRACIÓN DE REENVÍO ---
        Swal.fire({ icon: 'success', title: 'Código reenviado', timer: 1400, showConfirmButton: false });
      } catch (error) {
        console.error('Error reenviando código:', error);
        Swal.fire({ icon: 'error', title: 'No se pudo reenviar el código' });
      }
    });
  }
});