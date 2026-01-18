// Admin UI Module - Handles parent interface rendering and interactions
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
        // Create parent login modal
        this.createLoginModal();

        // Create parent panel (hidden by default)
        this.createAdminPanel();

        // Create parent toggle button (hidden by default, shown after login)
        this.createAdminToggleButton();
    }

    createLoginModal() {
        this.modal = document.createElement('div');
        this.modal.id = 'parent-login-modal';
        this.modal.className = 'parent-modal';
        this.modal.innerHTML = `
            <div class="parent-modal-content">
                <div class="parent-modal-header">
                    <h3>Admin Login</h3>
                    <button class="parent-close-btn">&times;</button>
                </div>
                <div class="parent-modal-body">
                    <form id="parent-login-form">
                        <div class="parent-form-group">
                            <label for="parent-username">Username</label>
                            <input type="text" id="parent-username" required>
                        </div>
                        <div class="parent-form-group">
                            <label for="parent-password">Password</label>
                            <input type="password" id="parent-password" required>
                        </div>
                        <div class="parent-form-actions">
                            <button type="submit" class="parent-btn parent-btn-primary">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                            <button type="button" class="parent-btn parent-btn-secondary parent-cancel-btn">
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
        this.adminPanel.id = 'parent-panel';
        this.adminPanel.className = 'parent-panel';
        this.adminPanel.innerHTML = `
            <div class="parent-panel-header">
                <h3>Admin Control Panel</h3>
                <button class="parent-close-panel-btn">&times;</button>
            </div>
            <div class="parent-panel-body">
                <div class="parent-tabs">
                    <button class="parent-tab active" data-tab="users">Users</button>
                    <button class="parent-tab" data-tab="credits">Credits</button>
                    <button class="parent-tab" data-tab="multipliers">Multipliers</button>
                </div>
                <div class="parent-tab-content">
                    <div id="parent-users-tab" class="parent-tab-pane active">
                        <!-- User management content will be loaded here -->
                        <div class="parent-loading">Loading users...</div>
                    </div>
                    <div id="parent-credits-tab" class="parent-tab-pane">
                        <!-- Credit editing content will be loaded here -->
                        <div class="parent-loading">Loading credit editor...</div>
                    </div>
                    <div id="parent-multipliers-tab" class="parent-tab-pane">
                        <!-- Multiplier editing content will be loaded here -->
                        <div class="parent-loading">Loading multiplier editor...</div>
                    </div>
                </div>
            </div>
            <div class="parent-panel-footer">
                <button class="parent-btn parent-btn-secondary parent-logout-btn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        `;
        document.body.appendChild(this.adminPanel);
    }

    createAdminToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'parent-toggle-btn';
        this.toggleButton.className = 'parent-toggle-btn';
        this.toggleButton.innerHTML = '<i class="fas fa-cog"></i>';
        this.toggleButton.title = 'Admin Panel';
        document.body.appendChild(this.toggleButton);
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('parent-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Close modal buttons
        const closeBtn = this.modal.querySelector('.parent-close-btn');
        const cancelBtn = this.modal.querySelector('.parent-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideLoginModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideLoginModal());

        // Admin panel close button
        const closePanelBtn = this.adminPanel.querySelector('.parent-close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => this.hideAdminPanel());
        }

        // Admin toggle button
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggleAdminPanel());
        }

        // Admin logout button
        const logoutBtn = this.adminPanel.querySelector('.parent-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.adminModule.logoutAdmin());
        }

        // Tab switching
        const tabs = this.adminPanel.querySelectorAll('.parent-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
    }

    async handleLogin() {
        const username = document.getElementById('parent-username').value;
        const password = document.getElementById('parent-password').value;

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
        document.getElementById('parent-username').focus();
    }

    hideLoginModal() {
        this.modal.classList.remove('active');
        document.getElementById('parent-login-form').reset();
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
        const tabs = this.adminPanel.querySelectorAll('.parent-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update active tab pane
        const tabPanes = this.adminPanel.querySelectorAll('.parent-tab-pane');
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `parent-${tabName}-tab`);
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