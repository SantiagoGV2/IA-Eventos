/**
 * Módulo de Seguridad para Autenticación
 * Implementa mejores prácticas de seguridad para el manejo de JWT
 */
'use strict';

class AuthSecurity {
    constructor() {
        this.TOKEN_KEY = 'auth_token';
        this.TOKEN_EXPIRY_KEY = 'auth_expiry';
        this.REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos antes de expirar
        this.sessionChecker = null;
    }

    /**
     * Almacena el token de forma más segura
     * @param {string} token - JWT token
     * @param {number} expiresIn - Tiempo de expiración en segundos
     */
    setToken(token, expiresIn = 3600) {
        try {
            // Calcular tiempo de expiración
            const expiryTime = Date.now() + (expiresIn * 1000);
            
            // Almacenar con información de expiración
            sessionStorage.setItem(this.TOKEN_KEY, token);
            sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
            
            // Iniciar verificación automática de sesión
            this.startSessionChecker();
            
            // Eliminar cualquier log del token
            console.log('Token almacenado de forma segura');
        } catch (error) {
            console.error('Error al almacenar token:', error);
            this.clearToken();
        }
    }

    /**
     * Obtiene el token si es válido
     * @returns {string|null} Token válido o null
     */
    getToken() {
        try {
            const token = sessionStorage.getItem(this.TOKEN_KEY);
            const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
            
            if (!token || !expiry) {
                return null;
            }

            // Verificar si el token ha expirado
            if (Date.now() >= parseInt(expiry)) {
                this.clearToken();
                this.redirectToLogin('Tu sesión ha expirado');
                return null;
            }

            return token;
        } catch (error) {
            console.error('Error al obtener token:', error);
            this.clearToken();
            return null;
        }
    }

    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.getToken() !== null;
    }

    /**
     * Verifica si el token necesita renovación
     * @returns {boolean}
     */
    needsRefresh() {
        try {
            const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
            if (!expiry) return false;
            
            const timeLeft = parseInt(expiry) - Date.now();
            return timeLeft <= this.REFRESH_THRESHOLD;
        } catch (error) {
            return false;
        }
    }

    /**
     * Limpia toda la información de autenticación
     */
    clearToken() {
        try {
            sessionStorage.removeItem(this.TOKEN_KEY);
            sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
            localStorage.removeItem('jwtToken'); // Limpiar el almacenamiento anterior
            this.stopSessionChecker();
        } catch (error) {
            console.error('Error al limpiar token:', error);
        }
    }

    /**
     * Obtiene headers de autenticación seguros
     * @returns {Object|null}
     */
    getAuthHeaders() {
        const token = this.getToken();
        if (!token) {
            return null;
        }

        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // Protección básica contra CSRF
        };
    }

    /**
     * Inicia el verificador automático de sesión
     */
    startSessionChecker() {
        this.stopSessionChecker();
        
        this.sessionChecker = setInterval(() => {
            if (!this.isAuthenticated()) {
                this.redirectToLogin('Sesión inválida');
                return;
            }
            
            if (this.needsRefresh()) {
                this.handleTokenRefresh();
            }
        }, 60000); // Verificar cada minuto
    }

    /**
     * Detiene el verificador de sesión
     */
    stopSessionChecker() {
        if (this.sessionChecker) {
            clearInterval(this.sessionChecker);
            this.sessionChecker = null;
        }
    }

    /**
     * Maneja la renovación automática del token
     */
    async handleTokenRefresh() {
        try {
            console.log('Intentando renovar token...');
            // Aquí implementarías la lógica para renovar el token
            // Por ejemplo, llamar a un endpoint de refresh
            
            const response = await this.refreshToken();
            if (response && response.token) {
                this.setToken(response.token, response.expiresIn);
                console.log('Token renovado exitosamente');
            }
        } catch (error) {
            console.error('Error al renovar token:', error);
            this.redirectToLogin('Error al renovar sesión');
        }
    }

    /**
     * Llama al endpoint de renovación de token
     * @returns {Promise<Object>}
     */
    async refreshToken() {
        const headers = this.getAuthHeaders();
        if (!headers) throw new Error('No hay token para renovar');

        const response = await fetch(this.getApiUrl('/auth/refresh'), {
            method: 'POST',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('No se pudo renovar el token');
        }

        return await response.json();
    }

    /**
     * Obtiene la URL base de la API
     * @param {string} endpoint 
     * @returns {string}
     */
    getApiUrl(endpoint) {
        // En producción, usar HTTPS
        const baseUrl = window.location.protocol === 'https:' 
            ? 'https://tu-dominio.com/project-AI'
            : 'http://localhost:8080/project-AI';
        
        return baseUrl + endpoint;
    }

    /**
     * Redirige al login con mensaje
     * @param {string} message 
     */
    redirectToLogin(message = 'Necesitas iniciar sesión') {
        this.clearToken();
        
        Swal.fire({
            icon: 'warning',
            title: 'Sesión requerida',
            text: message,
            confirmButtonText: 'Ir a Login'
        }).then(() => {
            // Determinar si estamos en admin o usuario normal
            const isAdmin = window.location.pathname.includes('/admin/');
            const loginUrl = isAdmin ? '/admin/index.html' : '/pages/login.html';
            window.location.href = loginUrl;
        });
    }

    /**
     * Cierra sesión de forma segura
     */
    async logout() {
        try {
            // Intentar notificar al servidor sobre el logout
            const headers = this.getAuthHeaders();
            if (headers) {
                await fetch(this.getApiUrl('/auth/logout'), {
                    method: 'POST',
                    headers: headers
                }).catch(() => {
                    // Ignorar errores de logout en el servidor
                });
            }
        } catch (error) {
            console.error('Error durante logout:', error);
        } finally {
            this.clearToken();
            this.redirectToLogin('Sesión cerrada exitosamente');
        }
    }

    /**
     * Valida formato del email
     * @param {string} email 
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida fortaleza de contraseña
     * @param {string} password 
     * @returns {Object}
     */
    validatePassword(password) {
        return {
            isValid: password.length >= 8,
            hasMinLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    }
}

// Crear instancia global
window.authSecurity = new AuthSecurity();

// Limpiar el localStorage anterior al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Migrar token existente si existe
    const oldToken = localStorage.getItem('jwtToken');
    if (oldToken) {
        console.log('Migrando token a almacenamiento seguro...');
        window.authSecurity.setToken(oldToken);
        localStorage.removeItem('jwtToken');
    }
});

// Limpiar sesión al cerrar/recargar página
window.addEventListener('beforeunload', () => {
    window.authSecurity.stopSessionChecker();
}); 