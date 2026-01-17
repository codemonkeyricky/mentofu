// Admin UI Module - Handles admin interface rendering and interactions
export default class AdminUI {
    constructor(adminModule) {
        this.adminModule = adminModule;
        this.app = adminModule.app;
        this.modal = null;
        this.adminPanel = null;
        this.init();
    }

    init() {
        this.createAdminElements();
        this.setupEventListeners();
    }

    createAdminElements() {
        // Create admin login modal
        this.createLoginModal();

        // Create admin panel (hidden by default)
        this.createAdminPanel();

        // Create admin toggle button (hidden by default, shown after login)
        this.createAdminToggleButton();
    }

    createLoginModal() {
        this.modal = document.createElement('div');
        this.modal.id = 'admin-login-modal';
        this.modal.className = 'admin-modal';
        this.modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h3>Admin Login</h3>
                    <button class="admin-close-btn">&times;</button>
                </div>
                <div class="admin-modal-body">
                    <form id="admin-login-form">
                        <div class="admin-form-group">
                            <label for="admin-username">Username</label>
                            <input type="text" id="admin-username" required>
                        </div>
                        <div class="admin-form-group">
                            <label for="admin-password">Password</label>
                            <input type="password" id="admin-password" required>
                        </div>
                        <div class="admin-form-actions">
                            <button type="submit" class="admin-btn admin-btn-primary">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                            <button type="button" class="admin-btn admin-btn-secondary admin-cancel-btn">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    createAdminPanel() {
        this.adminPanel = document.createElement('div');
        this.adminPanel.id = 'admin-panel';
        this.adminPanel.className = 'admin-panel';
        this.adminPanel.innerHTML = `
            <div class="admin-panel-header">
                <h3>Admin Control Panel</h3>
                <button class="admin-close-panel-btn">&times;</button>
            </div>
            <div class="admin-panel-body">
                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="users">Users</button>
                    <button class="admin-tab" data-tab="credits">Credits</button>
                    <button class="admin-tab" data-tab="multipliers">Multipliers</button>
                </div>
                <div class="admin-tab-content">
                    <div id="admin-users-tab" class="admin-tab-pane active">
                        <!-- User management content will be loaded here -->
                        <div class="admin-loading">Loading users...</div>
                    </div>
                    <div id="admin-credits-tab" class="admin-tab-pane">
                        <!-- Credit editing content will be loaded here -->
                        <div class="admin-loading">Loading credit editor...</div>
                    </div>
                    <div id="admin-multipliers-tab" class="admin-tab-pane">
                        <!-- Multiplier editing content will be loaded here -->
                        <div class="admin-loading">Loading multiplier editor...</div>
                    </div>
                </div>
            </div>
            <div class="admin-panel-footer">
                <button class="admin-btn admin-btn-secondary admin-logout-btn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        `;
        document.body.appendChild(this.adminPanel);
    }

    createAdminToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'admin-toggle-btn';
        this.toggleButton.className = 'admin-toggle-btn';
        this.toggleButton.innerHTML = '<i class="fas fa-cog"></i>';
        this.toggleButton.title = 'Admin Panel';
        document.body.appendChild(this.toggleButton);
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Close modal buttons
        const closeBtn = this.modal.querySelector('.admin-close-btn');
        const cancelBtn = this.modal.querySelector('.admin-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideLoginModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideLoginModal());

        // Admin panel close button
        const closePanelBtn = this.adminPanel.querySelector('.admin-close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => this.hideAdminPanel());
        }

        // Admin toggle button
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggleAdminPanel());
        }

        // Admin logout button
        const logoutBtn = this.adminPanel.querySelector('.admin-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.adminModule.logoutAdmin());
        }

        // Tab switching
        const tabs = this.adminPanel.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
    }

    async handleLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        const result = await this.adminModule.auth.login(username, password);

        if (result.success) {
            this.hideLoginModal();
            this.showAdminInterface();
            this.app.showNotification('Admin login successful', 'success');
        } else {
            this.app.showNotification(result.message, 'error');
        }
    }

    showLoginModal() {
        this.modal.classList.add('active');
        document.getElementById('admin-username').focus();
    }

    hideLoginModal() {
        this.modal.classList.remove('active');
        document.getElementById('admin-login-form').reset();
    }

    showAdminInterface() {
        this.toggleButton.classList.add('visible');
        this.showAdminPanel();
        // Load initial data
        this.adminModule.userManager.loadUsers();
    }

    hideAdminInterface() {
        this.toggleButton.classList.remove('visible');
        this.hideAdminPanel();
    }

    showAdminPanel() {
        this.adminPanel.classList.add('active');
    }

    hideAdminPanel() {
        this.adminPanel.classList.remove('active');
    }

    toggleAdminPanel() {
        if (this.adminPanel.classList.contains('active')) {
            this.hideAdminPanel();
        } else {
            this.showAdminPanel();
        }
    }

    switchTab(tabName) {
        // Update active tab
        const tabs = this.adminPanel.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update active tab pane
        const tabPanes = this.adminPanel.querySelectorAll('.admin-tab-pane');
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `admin-${tabName}-tab`);
        });

        // Load tab content if needed
        switch (tabName) {
            case 'users':
                this.adminModule.userManager.loadUsers();
                break;
            case 'credits':
                this.adminModule.creditEditor.loadCreditEditor();
                break;
            case 'multipliers':
                this.adminModule.multiplierEditor.loadMultiplierEditor();
                break;
        }
    }

    showNotification(message, type = 'info') {
        this.app.showNotification(`[Admin] ${message}`, type);
    }
}