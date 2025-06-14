'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const formLogin = document.getElementById('loginForm');

    if (formLogin) {
        formLogin.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (!email || !password) {
                alert("Por favor, ingresa tu correo y contraseña.");
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
                    // 1. Guarda el token limpio (esto ya está correcto)
                    localStorage.setItem("jwtToken", data.token);

                    // 2. Dale al navegador un pequeño respiro (100 milisegundos) antes de redirigir
                    // para asegurar que la operación de guardado se complete.
                    setTimeout(() => {
                        window.location.href = "/pages/inicio.html";
                    }, 100); // 100ms es suficiente y el usuario no lo notará.

                } else {
                    alert("Error: No se recibió el token de autenticación.");
                }

            } catch (error) {
                console.error("Error en el login:", error);
                alert("Error al iniciar sesión. Verifique sus credenciales.");
            }
        });
    }
});
