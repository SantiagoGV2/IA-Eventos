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

            try {
                const response = await fetch("http://localhost:8080/project-AI/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Error en las credenciales");
                }

                console.log("Respuesta del backend:", data);

                 if (data.token) {
                    localStorage.setItem("jwtToken", data.token);

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
