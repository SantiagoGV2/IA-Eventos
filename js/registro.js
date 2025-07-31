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
            const termsCheck = document.getElementById('termsCheck');

           if (password !== confirmPassword) {
                Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
                return;
            }

            if (password.length < 6) {
                Swal.fire('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.', 'warning');
                return;
            }

            // Verificar términos y condiciones
            
            if (!termsCheck) {
                Swal.fire('Términos y condiciones', 'Debes aceptar los términos y condiciones para continuar.', 'warning');
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/project-AI/usuarioAG', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        usuNombre: nombre,
                        usuEmail: email,
                        usuPassword: password
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
                    window.location.href = '/pages/login.html';
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
