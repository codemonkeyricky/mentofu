// Admin Authentication Module
export default class AdminAuth {
    constructor(adminModule) {
        this.adminModule = adminModule;
        this.app = adminModule.app;
    }

    async login(username, password) {
        try {
            const response = await fetch('/parent/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(`Login failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.token) {
                // Store parent token in sessionStorage (not localStorage for security)
                sessionStorage.setItem('adminToken', data.token);
                this.adminModule.adminToken = data.token;
                this.adminModule.isParent = true;

                return { success: true, message: 'Admin login successful' };
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            return {
                success: false,
                message: error.message || 'Admin login failed. Please check credentials.'
            };
        }
    }

    async validateToken() {
        if (!this.adminModule.adminToken) {
            return false;
        }

        try {
            const response = await fetch('/parent/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.adminModule.adminToken}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    logout() {
        sessionStorage.removeItem('adminToken');
        this.adminModule.adminToken = null;
        this.adminModule.isParent = false;
    }
}