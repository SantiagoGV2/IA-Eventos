'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const formLogin = document.getElementById('loginForm');

    if (formLogin) {
        formLogin.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

           if (!email || !password) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Por favor, ingresa tu correo y contraseña.',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            // Validar formato de email
            if (!window.authSecurity.isValidEmail(email)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Email inválido',
                    text: 'Por favor, ingresa un email válido.',
                    confirmButtonColor: '#d33'
                });
                return;
            }

            try {
                const response = await fetch(window.authSecurity.getApiUrl("/login"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Error en las credenciales");
                }

                // NO registrar información sensible en consola
                console.log("Login exitoso");

                 if (data.token) {
                    // Usar el nuevo sistema de almacenamiento seguro
                    window.authSecurity.setToken(data.token, data.expiresIn || 3600);

                    await Swal.fire({
                        icon: 'success',
                        title: '¡Inicio de sesión exitoso!',
                        text: 'Serás redirigido en un momento.',
                        timer: 1500,
                        showConfirmButton: false,
                        allowOutsideClick: false
                    });

                    window.location.href = "/pages/inicio.html";

                } else {
                    throw new Error("No se recibió el token de autenticación.");
                }

            } catch (error) {
                console.error("Error en el login:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error al iniciar sesión',
                    text: error.message || 'Verifique sus credenciales e intente de nuevo.',
                    confirmButtonColor: '#d33'
                });
            }
        });
    }
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