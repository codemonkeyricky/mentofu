// Admin Main Module - Entry point for parent functionality
import AdminAuth from './parent-auth.js';
import AdminUI from './parent-ui.js';
import UserManager from './user-manager.js';
import CreditEditor from './credit-editor.js';
import MultiplierEditor from './multiplier-editor.js';

export default class AdminModule {
    constructor(app) {
        this.app = app;
        this.isParent = false;
        this.adminToken = null;

        // Initialize sub-modules
        this.auth = new AdminAuth(this);
        this.ui = new AdminUI(this);
        this.userManager = new UserManager(this);
        this.creditEditor = new CreditEditor(this);
        this.multiplierEditor = new MultiplierEditor(this);

        // Initialize parent module
        this.init();
    }

    init() {
        console.log('Admin module initialized');
        // Check for existing parent session
        this.checkAdminSession();
    }

    checkAdminSession() {
        const adminToken = sessionStorage.getItem('adminToken');
        if (adminToken) {
            this.adminToken = adminToken;
            this.isParent = true;
            console.log('Admin session found');
        }
    }

    // Public API methods
    showAdminLogin() {
        this.ui.showLoginModal();
    }

    logoutAdmin() {
        sessionStorage.removeItem('adminToken');
        this.adminToken = null;
        this.isParent = false;
        this.ui.hideAdminInterface();
        console.log('Admin logged out');
    }

    // Utility methods
    getApiHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`
        };
    }

    async makeAdminRequest(url, options = {}) {
        if (!this.isParent) {
            throw new Error('Admin authentication required');
        }

        const defaultOptions = {
            headers: this.getApiHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            if (!response.ok) {
                throw new Error(`Admin API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Admin request failed:', error);
            throw error;
        }
    }
}