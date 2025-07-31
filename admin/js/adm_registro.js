'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const formUsuario = document.getElementById('registerForm');

    if (formUsuario) {
        formUsuario.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nombre = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden.');
                return;
            }

            if (password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres.');
                return;
            }

            // Verificar términos y condiciones
            const termsCheck = document.getElementById('termsCheck');
            if (!termsCheck.checked) {
                alert('Debes aceptar los términos y condiciones.');
                return;
            }

            console.log('Enviando datos:', { admNombre: nombre, admEmail: email, admPassword: password });

            try {
                const response = await fetch('http://localhost:8080/project-AI/adminAG', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        admNombre: nombre,
                        admEmail: email,
                        admPassword: password
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    await Swal.fire({
                        icon: 'success',
                        title: '¡Registro exitoso!',
                        text: data.message || 'Ahora serás redirigido a la página de inicio de sesión.',
                        timer: 2000,
                        showConfirmButton: false,
                        allowOutsideClick: false
                    });
                    formUsuario.reset();
                    window.location.href = '/admin/adm_login.html';
                } else {
                    throw new Error(data.message || 'Error al registrar el usuario.');
                }
            } catch (error) {
                console.error('Error en el registro:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error en el registro',
                    text: error.message,
                });
            }
        });
    }
});