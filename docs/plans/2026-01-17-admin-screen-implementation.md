# Admin Screen UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement web-based admin interface as modal overlay allowing admins to adjust user earned/claimed credits and quiz multipliers.

**Architecture:** Admin interface appears as modal overlay on main quiz app with separate admin login, distinct dark styling, and integration with existing admin API endpoints. Uses sessionStorage for admin JWT tokens and follows existing fetch patterns.

**Tech Stack:** Vanilla JavaScript ES6 modules, CSS for admin styling, existing Three.js background, Chart.js for optional stats.

---

### Task 1: Create Admin Module Structure

**Files:**
- Create: `src/client/public/js/admin/admin-auth.js`
- Create: `src/client/public/js/admin/admin-ui.js`
- Create: `src/client/public/js/admin/user-manager.js`
- Create: `src/client/public/js/admin/credit-editor.js`
- Create: `src/client/public/js/admin/multiplier-editor.js`
- Create: `src/client/public/js/admin/admin-main.js`
- Create: `src/client/public/css/admin.css`
- Modify: `src/client/index.html:322-325` (add admin script references)
- Modify: `src/client/public/js/main.js:26-27` (add admin module import)

**Step 1: Create admin directory and module files**

```bash
mkdir -p src/client/public/js/admin
touch src/client/public/js/admin/{admin-auth,admin-ui,user-manager,credit-editor,multiplier-editor,admin-main}.js
touch src/client/public/css/admin.css
```

**Step 2: Verify files created**

```bash
ls -la src/client/public/js/admin/
```
Expected: 6 JavaScript files listed

**Step 3: Add admin script references to HTML**

Edit `src/client/index.html` after line 324:
```html
    <script type="module" src="/js/admin/admin-main.js"></script>
```

**Step 4: Add admin CSS reference to HTML**

Edit `src/client/index.html` after line 7:
```html
    <link rel="stylesheet" href="/css/admin.css">
```

**Step 5: Import admin module in main.js**

Edit `src/client/public/js/main.js` after line 1:
```javascript
import AdminModule from './admin/admin-main.js';
```

Add after line 13 (constructor initialization):
```javascript
        // Initialize admin module
        this.adminModule = new AdminModule(this);
```

**Step 6: Commit foundation files**

```bash
git add src/client/public/js/admin/ src/client/public/css/admin.css src/client/index.html src/client/public/js/main.js
git commit -m "feat: create admin module structure and foundation files"
```

---

### Task 2: Implement Admin Authentication Module

**Files:**
- Create: `src/client/public/js/admin/admin-auth.js` (full implementation)
- Modify: `src/client/public/js/admin/admin-main.js:1-50` (import and setup)
- Modify: `src/client/public/css/admin.css:1-100` (admin login styles)

**Step 1: Write admin-auth.js skeleton with authentication functions**

Create file with:
```javascript
export class AdminAuth {
    constructor(app) {
        this.app = app;
        this.adminToken = null;
        this.adminUser = null;
    }

    async login(username, password) {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(`Login failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.user.isAdmin) {
                throw new Error('User is not an administrator');
            }

            this.adminToken = data.token;
            this.adminUser = data.user;
            sessionStorage.setItem('adminToken', data.token);
            sessionStorage.setItem('adminUser', JSON.stringify(data.user));

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Admin login error:', error);
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.adminToken = null;
        this.adminUser = null;
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
    }

    isAuthenticated() {
        if (this.adminToken) return true;

        const storedToken = sessionStorage.getItem('adminToken');
        const storedUser = sessionStorage.getItem('adminUser');

        if (storedToken && storedUser) {
            this.adminToken = storedToken;
            this.adminUser = JSON.parse(storedUser);
            return true;
        }

        return false;
    }

    getAuthHeaders() {
        if (!this.adminToken) {
            throw new Error('No admin authentication token available');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`
        };
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const headers = this.getAuthHeaders();
        const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('Authentication expired. Please log in again.');
        }

        return response;
    }
}
```

**Step 2: Test admin-auth.js syntax**

```bash
node -c src/client/public/js/admin/admin-auth.js
```
Expected: No output (syntax OK)

**Step 3: Create admin-main.js with basic structure**

Create file with:
```javascript
import { AdminAuth } from './admin-auth.js';
import { AdminUI } from './admin-ui.js';
import { UserManager } from './user-manager.js';
import { CreditEditor } from './credit-editor.js';
import { MultiplierEditor } from './multiplier-editor.js';

export default class AdminModule {
    constructor(app) {
        this.app = app;
        this.auth = new AdminAuth(app);
        this.ui = new AdminUI(app, this);
        this.userManager = new UserManager(app, this);
        this.creditEditor = new CreditEditor(app, this);
        this.multiplierEditor = new MultiplierEditor(app, this);

        this.init();
    }

    init() {
        console.log('Admin module initialized');
        // Check if admin is already authenticated
        if (this.auth.isAuthenticated()) {
            this.ui.showUserManagement();
        }
    }

    // Public API for main app to trigger admin interface
    showAdminInterface() {
        if (this.auth.isAuthenticated()) {
            this.ui.showUserManagement();
        } else {
            this.ui.showLogin();
        }
    }
}
```

**Step 4: Test admin-main.js syntax**

```bash
node -c src/client/public/js/admin/admin-main.js
```
Expected: No output (syntax OK)

**Step 5: Add basic admin login styles**

Create `src/client/public/css/admin.css` with:
```css
/* Admin Interface Overrides - Dark Theme */
.admin-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
}

.admin-modal {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    padding: 32px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    position: relative;
}

.admin-modal h2 {
    color: #4cc9f0;
    margin-bottom: 8px;
    font-size: 24px;
    font-weight: 600;
}

.admin-modal .modal-subtitle {
    color: #a0a0a0;
    margin-bottom: 24px;
    font-size: 14px;
}

.admin-form .form-group {
    margin-bottom: 20px;
}

.admin-form .form-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #ffffff;
    font-size: 16px;
    transition: border-color 0.2s;
}

.admin-form .form-input:focus {
    outline: none;
    border-color: #4cc9f0;
    box-shadow: 0 0 0 2px rgba(76, 201, 240, 0.2);
}

.admin-btn {
    background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.admin-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(67, 97, 238, 0.3);
}

.admin-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.admin-error {
    color: #f72585;
    font-size: 14px;
    margin-top: 8px;
    display: none;
}

.admin-error.show {
    display: block;
}
```

**Step 6: Commit admin authentication foundation**

```bash
git add src/client/public/js/admin/admin-auth.js src/client/public/js/admin/admin-main.js src/client/public/css/admin.css
git commit -m "feat: implement admin authentication module with dark theme styles"
```

---

### Task 3: Create Admin UI Modal System

**Files:**
- Create: `src/client/public/js/admin/admin-ui.js` (full implementation)
- Modify: `src/client/public/css/admin.css:100-300` (add modal styles)
- Modify: `src/client/index.html:326-330` (add admin modal containers)

**Step 1: Add admin modal containers to HTML**

Edit `src/client/index.html` before closing `</body>` tag (after line 325):
```html
    <!-- Admin Interface Containers -->
    <div id="admin-overlay" class="admin-overlay" style="display: none;">
        <!-- Admin Login Modal -->
        <div id="admin-login-modal" class="admin-modal" style="display: none;">
            <div class="modal-header">
                <h2><i class="fas fa-lock"></i> Admin Login</h2>
                <p class="modal-subtitle">Administrator access only</p>
            </div>
            <form id="admin-login-form" class="admin-form">
                <div class="form-group">
                    <input type="text" id="admin-username" class="form-input"
                           placeholder="Admin username" required>
                </div>
                <div class="form-group">
                    <input type="password" id="admin-password" class="form-input"
                           placeholder="Admin password" required>
                </div>
                <div id="admin-login-error" class="admin-error"></div>
                <button type="submit" class="admin-btn btn-block">
                    <i class="fas fa-sign-in-alt"></i> Sign In as Admin
                </button>
            </form>
        </div>

        <!-- User Management Modal -->
        <div id="admin-user-management-modal" class="admin-modal" style="display: none;">
            <div class="modal-header">
                <h2><i class="fas fa-users"></i> User Management</h2>
                <p class="modal-subtitle">Manage user credits and multipliers</p>
                <button id="admin-logout-btn" class="admin-btn btn-outline">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
            <div id="admin-user-list-container">
                <!-- User list will be loaded here -->
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i> Loading users...
                </div>
            </div>
        </div>
    </div>
```

**Step 2: Implement admin-ui.js with modal management**

Create `src/client/public/js/admin/admin-ui.js`:
```javascript
export class AdminUI {
    constructor(app, adminModule) {
        this.app = app;
        this.adminModule = adminModule;
        this.initDOMReferences();
        this.initEventListeners();
    }

    initDOMReferences() {
        this.overlay = document.getElementById('admin-overlay');
        this.loginModal = document.getElementById('admin-login-modal');
        this.userManagementModal = document.getElementById('admin-user-management-modal');
        this.loginForm = document.getElementById('admin-login-form');
        this.usernameInput = document.getElementById('admin-username');
        this.passwordInput = document.getElementById('admin-password');
        this.loginError = document.getElementById('admin-login-error');
        this.logoutBtn = document.getElementById('admin-logout-btn');
        this.userListContainer = document.getElementById('admin-user-list-container');
    }

    initEventListeners() {
        this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutBtn?.addEventListener('click', () => this.handleLogout());

        // Close modal when clicking outside
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hideAll();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hideAll();
            }
        });
    }

    showOverlay() {
        this.overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    hideOverlay() {
        this.overlay.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }

    showLogin() {
        this.showOverlay();
        this.hideAllModals();
        this.loginModal.style.display = 'block';
        this.usernameInput.focus();
        this.clearLoginError();
    }

    showUserManagement() {
        this.showOverlay();
        this.hideAllModals();
        this.userManagementModal.style.display = 'block';
        // Trigger user list loading
        this.adminModule.userManager.loadUsers();
    }

    hideAllModals() {
        this.loginModal.style.display = 'none';
        this.userManagementModal.style.display = 'none';
    }

    hideAll() {
        this.hideOverlay();
        this.hideAllModals();
    }

    isVisible() {
        return this.overlay.style.display === 'flex';
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        if (!username || !password) {
            this.showLoginError('Please enter both username and password');
            return;
        }

        // Show loading state
        const submitBtn = this.loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        submitBtn.disabled = true;
        this.clearLoginError();

        try {
            const result = await this.adminModule.auth.login(username, password);

            if (result.success) {
                this.showNotification('Admin login successful', 'success');
                this.showUserManagement();
            } else {
                this.showLoginError(result.error || 'Login failed');
            }
        } catch (error) {
            this.showLoginError(error.message || 'An unexpected error occurred');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    handleLogout() {
        this.adminModule.auth.logout();
        this.showNotification('Admin logged out', 'info');
        this.hideAll();
    }

    showLoginError(message) {
        this.loginError.textContent = message;
        this.loginError.classList.add('show');
    }

    clearLoginError() {
        this.loginError.textContent = '';
        this.loginError.classList.remove('show');
    }

    showNotification(message, type = 'info') {
        // Use existing app notification system or create simple one
        if (this.app.showNotification) {
            this.app.showNotification(`[Admin] ${message}`, type);
        } else {
            console.log(`Admin Notification (${type}): ${message}`);
            alert(`Admin: ${message}`);
        }
    }

    // User list rendering helper
    renderUserList(users) {
        if (!users || users.length === 0) {
            this.userListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <h3>No users found</h3>
                    <p>No users match your search criteria.</p>
                </div>
            `;
            return;
        }

        this.userListContainer.innerHTML = `
            <div class="user-list-header">
                <div class="search-box">
                    <input type="text" id="admin-user-search" class="form-input"
                           placeholder="Search users...">
                </div>
                <div class="pagination-controls">
                    <button id="admin-prev-page" class="admin-btn btn-outline" disabled>
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <span id="admin-page-info">Page 1 of 1</span>
                    <button id="admin-next-page" class="admin-btn btn-outline" disabled>
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            <div class="user-list">
                ${users.map(user => this.renderUserListItem(user)).join('')}
            </div>
        `;
    }

    renderUserListItem(user) {
        return `
            <div class="user-list-item" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-details">
                        <h4 class="username">${user.username}</h4>
                        <div class="user-stats">
                            <span class="stat">
                                <i class="fas fa-coins"></i> Earned: ${user.earnedCredits || 0}
                            </span>
                            <span class="stat">
                                <i class="fas fa-gift"></i> Claimed: ${user.claimedCredits || 0}
                            </span>
                            <span class="stat">
                                <i class="fas fa-calendar"></i> Joined: ${new Date(user.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="admin-btn btn-outline edit-credits-btn"
                            data-user-id="${user.id}">
                        <i class="fas fa-coins"></i> Edit Credits
                    </button>
                    <button class="admin-btn btn-outline edit-multipliers-btn"
                            data-user-id="${user.id}">
                        <i class="fas fa-chart-line"></i> Edit Multipliers
                    </button>
                </div>
            </div>
        `;
    }

    showLoading() {
        this.userListContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i> Loading...
            </div>
        `;
    }

    showError(message) {
        this.userListContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading users</h3>
                <p>${message}</p>
                <button id="retry-load-users" class="admin-btn">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;

        document.getElementById('retry-load-users')?.addEventListener('click', () => {
            this.adminModule.userManager.loadUsers();
        });
    }
}
```

**Step 3: Add user list styles to admin.css**

Append to `src/client/public/css/admin.css`:
```css
/* User Management Styles */
.user-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
}

.search-box {
    flex: 1;
    min-width: 250px;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 16px;
}

#admin-page-info {
    color: #a0a0a0;
    font-size: 14px;
    min-width: 80px;
    text-align: center;
}

.btn-outline {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
}

.btn-outline:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
}

.btn-block {
    width: 100%;
}

.user-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 8px;
}

.user-list-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s, border-color 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.user-list-item:hover {
    transform: translateY(-2px);
    border-color: rgba(76, 201, 240, 0.3);
    background: rgba(255, 255, 255, 0.08);
}

.user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
}

.user-details {
    flex: 1;
}

.username {
    margin: 0 0 8px 0;
    color: #ffffff;
    font-size: 18px;
    font-weight: 500;
}

.user-stats {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.stat {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #a0a0a0;
    font-size: 14px;
}

.stat i {
    color: #4cc9f0;
}

.user-actions {
    display: flex;
    gap: 12px;
}

.loading-state, .empty-state, .error-state {
    text-align: center;
    padding: 60px 20px;
    color: #a0a0a0;
}

.loading-state i, .empty-state i, .error-state i {
    font-size: 48px;
    margin-bottom: 20px;
    color: #4cc9f0;
}

.empty-state i {
    color: #a0a0a0;
}

.error-state i {
    color: #f72585;
}

.error-state h3 {
    color: #f72585;
    margin-bottom: 8px;
}
```

**Step 4: Test UI module syntax**

```bash
node -c src/client/public/js/admin/admin-ui.js
```
Expected: No output (syntax OK)

**Step 5: Commit UI module implementation**

```bash
git add src/client/public/js/admin/admin-ui.js src/client/public/css/admin.css src/client/index.html
git commit -m "feat: implement admin UI modal system with user management interface"
```

---

### Task 4: Implement User Manager Module

**Files:**
- Create: `src/client/public/js/admin/user-manager.js` (full implementation)
- Modify: `src/client/public/js/admin/admin-ui.js:150-200` (add event delegation for user actions)
- Modify: `src/client/public/css/admin.css:300-400` (add pagination and search styles)

**Step 1: Implement user-manager.js with API integration**

Create `src/client/public/js/admin/user-manager.js`:
```javascript
export class UserManager {
    constructor(app, adminModule) {
        this.app = app;
        this.adminModule = adminModule;
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 1;
        this.searchTerm = '';
        this.initEventDelegation();
    }

    initEventDelegation() {
        // Event delegation for dynamically created elements
        document.addEventListener('click', (e) => {
            // Edit credits button
            if (e.target.closest('.edit-credits-btn')) {
                const userId = e.target.closest('.edit-credits-btn').dataset.userId;
                this.handleEditCredits(userId);
            }

            // Edit multipliers button
            if (e.target.closest('.edit-multipliers-btn')) {
                const userId = e.target.closest('.edit-multipliers-btn').dataset.userId;
                this.handleEditMultipliers(userId);
            }

            // Pagination buttons
            if (e.target.closest('#admin-prev-page')) {
                this.previousPage();
            }

            if (e.target.closest('#admin-next-page')) {
                this.nextPage();
            }

            // Search input
            const searchInput = document.getElementById('admin-user-search');
            if (searchInput && e.target === searchInput) {
                this.handleSearchInput();
            }
        });

        // Search input with debounce
        let searchTimeout;
        document.addEventListener('input', (e) => {
            if (e.target.id === 'admin-user-search') {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value.trim();
                    this.currentPage = 1;
                    this.loadUsers();
                }, 300);
            }
        });
    }

    async loadUsers() {
        this.adminModule.ui.showLoading();

        try {
            const url = this.buildUsersUrl();
            const response = await this.adminModule.auth.makeAuthenticatedRequest(url);

            if (!response.ok) {
                throw new Error(`Failed to load users: ${response.status}`);
            }

            const data = await response.json();
            this.totalPages = Math.ceil(data.total / this.pageSize) || 1;

            this.adminModule.ui.renderUserList(data.users);
            this.updatePaginationControls();

        } catch (error) {
            console.error('Error loading users:', error);
            this.adminModule.ui.showError(error.message);
        }
    }

    buildUsersUrl() {
        const params = new URLSearchParams({
            page: this.currentPage.toString(),
            limit: this.pageSize.toString()
        });

        if (this.searchTerm) {
            params.append('search', this.searchTerm);
        }

        return `/admin/users?${params.toString()}`;
    }

    updatePaginationControls() {
        const prevBtn = document.getElementById('admin-prev-page');
        const nextBtn = document.getElementById('admin-next-page');
        const pageInfo = document.getElementById('admin-page-info');

        if (prevBtn && nextBtn && pageInfo) {
            prevBtn.disabled = this.currentPage <= 1;
            nextBtn.disabled = this.currentPage >= this.totalPages;
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadUsers();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadUsers();
        }
    }

    handleSearchInput() {
        // Handled by input event listener with debounce
    }

    async handleEditCredits(userId) {
        try {
            // First fetch user details
            const user = await this.fetchUserDetails(userId);
            this.adminModule.creditEditor.show(user);
        } catch (error) {
            this.adminModule.ui.showNotification(`Failed to load user: ${error.message}`, 'error');
        }
    }

    async handleEditMultipliers(userId) {
        try {
            const user = await this.fetchUserDetails(userId);
            this.adminModule.multiplierEditor.show(user);
        } catch (error) {
            this.adminModule.ui.showNotification(`Failed to load user: ${error.message}`, 'error');
        }
    }

    async fetchUserDetails(userId) {
        const response = await this.adminModule.auth.makeAuthenticatedRequest(`/admin/users/${userId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch user details: ${response.status}`);
        }

        return await response.json();
    }
}
```

**Step 2: Add event delegation to admin-ui.js**

Add to `src/client/public/js/admin/admin-ui.js` after the `initEventListeners` method:
```javascript
    setupUserListEventDelegation() {
        this.userListContainer.addEventListener('click', (e) => {
            // Event delegation handled by UserManager
        });
    }
```

**Step 3: Add pagination and search styles**

Append to `src/client/public/css/admin.css`:
```css
/* Pagination and Search Styles */
.pagination-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination-controls button:disabled:hover {
    transform: none;
    background: transparent;
}

.search-box input {
    padding-left: 40px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23a0a0a0' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: 12px center;
    background-size: 16px;
}

.search-box input:focus {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%234cc9f0' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E");
}

/* Scrollbar styling for user list */
.user-list::-webkit-scrollbar {
    width: 6px;
}

.user-list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.user-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

.user-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}
```

**Step 4: Test user manager syntax**

```bash
node -c src/client/public/js/admin/user-manager.js
```
Expected: No output (syntax OK)

**Step 5: Commit user manager implementation**

```bash
git add src/client/public/js/admin/user-manager.js src/client/public/js/admin/admin-ui.js src/client/public/css/admin.css
git commit -m "feat: implement user manager with pagination, search, and API integration"
```

---

### Task 5: Implement Credit Editor Component

**Files:**
- Create: `src/client/public/js/admin/credit-editor.js` (full implementation)
- Modify: `src/client/index.html:331-360` (add credit editor modal HTML)
- Modify: `src/client/public/css/admin.css:400-550` (add credit editor styles)

**Step 1: Add credit editor modal to HTML**

Edit `src/client/index.html` after the user management modal (inside admin-overlay div):
```html
        <!-- Credit Editor Modal -->
        <div id="admin-credit-editor-modal" class="admin-modal" style="display: none;">
            <div class="modal-header">
                <h2><i class="fas fa-coins"></i> Edit User Credits</h2>
                <p class="modal-subtitle" id="credit-editor-username">Loading user...</p>
                <button id="credit-editor-back" class="admin-btn btn-outline">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            </div>

            <div class="credit-editor-container">
                <div class="current-credits">
                    <h3><i class="fas fa-chart-bar"></i> Current Credits</h3>
                    <div class="credit-display">
                        <div class="credit-item">
                            <span class="credit-label">Earned Credits:</span>
                            <span id="current-earned" class="credit-value">0</span>
                        </div>
                        <div class="credit-item">
                            <span class="credit-label">Claimed Credits:</span>
                            <span id="current-claimed" class="credit-value">0</span>
                        </div>
                        <div class="credit-item">
                            <span class="credit-label">Available Credits:</span>
                            <span id="current-available" class="credit-value">0</span>
                        </div>
                    </div>
                </div>

                <div class="credit-adjustment">
                    <h3><i class="fas fa-sliders-h"></i> Adjust Credits</h3>

                    <div class="adjustment-tabs">
                        <button class="tab-btn active" data-mode="absolute">Set Absolute Values</button>
                        <button class="tab-btn" data-mode="relative">Add/Subtract Amount</button>
                    </div>

                    <!-- Absolute Values Tab -->
                    <div id="absolute-adjustment" class="adjustment-panel active">
                        <div class="form-group">
                            <label for="new-earned">New Earned Credits:</label>
                            <input type="number" id="new-earned" class="form-input" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label for="new-claimed">New Claimed Credits:</label>
                            <input type="number" id="new-claimed" class="form-input" min="0" value="0">
                            <div id="claimed-warning" class="admin-error" style="display: none;">
                                <i class="fas fa-exclamation-triangle"></i> Claimed cannot exceed earned
                            </div>
                        </div>
                    </div>

                    <!-- Relative Adjustment Tab -->
                    <div id="relative-adjustment" class="adjustment-panel">
                        <div class="form-group">
                            <label for="earned-delta">Earned Change (±):</label>
                            <input type="number" id="earned-delta" class="form-input" value="0">
                        </div>
                        <div class="form-group">
                            <label for="claimed-delta">Claimed Change (±):</label>
                            <input type="number" id="claimed-delta" class="form-input" value="0">
                            <div id="delta-warning" class="admin-error" style="display: none;">
                                <i class="fas fa-exclamation-triangle"></i> Resulting claimed cannot exceed earned
                            </div>
                        </div>
                    </div>

                    <div class="preview-section">
                        <h4><i class="fas fa-eye"></i> Preview Changes</h4>
                        <div id="credit-preview" class="preview-display">
                            No changes made yet
                        </div>
                    </div>

                    <div class="editor-actions">
                        <button id="cancel-credit-edit" class="admin-btn btn-outline">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button id="save-credit-changes" class="admin-btn" disabled>
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
```

**Step 2: Implement credit-editor.js**

Create `src/client/public/js/admin/credit-editor.js`:
```javascript
export class CreditEditor {
    constructor(app, adminModule) {
        this.app = app;
        this.adminModule = adminModule;
        this.currentUser = null;
        this.currentMode = 'absolute'; // 'absolute' or 'relative'
        this.initDOMReferences();
        this.initEventListeners();
    }

    initDOMReferences() {
        this.modal = document.getElementById('admin-credit-editor-modal');
        this.usernameDisplay = document.getElementById('credit-editor-username');
        this.backBtn = document.getElementById('credit-editor-back');
        this.cancelBtn = document.getElementById('cancel-credit-edit');
        this.saveBtn = document.getElementById('save-credit-changes');

        // Current credit displays
        this.currentEarned = document.getElementById('current-earned');
        this.currentClaimed = document.getElementById('current-claimed');
        this.currentAvailable = document.getElementById('current-available');

        // Adjustment inputs
        this.newEarned = document.getElementById('new-earned');
        this.newClaimed = document.getElementById('new-claimed');
        this.earnedDelta = document.getElementById('earned-delta');
        this.claimedDelta = document.getElementById('claimed-delta');

        // Warnings
        this.claimedWarning = document.getElementById('claimed-warning');
        this.deltaWarning = document.getElementById('delta-warning');

        // Tabs and panels
        this.tabs = document.querySelectorAll('.tab-btn');
        this.panels = document.querySelectorAll('.adjustment-panel');

        // Preview
        this.preview = document.getElementById('credit-preview');
    }

    initEventListeners() {
        this.backBtn?.addEventListener('click', () => this.hide());
        this.cancelBtn?.addEventListener('click', () => this.hide());
        this.saveBtn?.addEventListener('click', () => this.saveChanges());

        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.mode));
        });

        // Real-time validation
        this.newEarned?.addEventListener('input', () => this.validateAbsoluteInputs());
        this.newClaimed?.addEventListener('input', () => this.validateAbsoluteInputs());
        this.earnedDelta?.addEventListener('input', () => this.validateRelativeInputs());
        this.claimedDelta?.addEventListener('input', () => this.validateRelativeInputs());

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    show(user) {
        this.currentUser = user;
        this.updateDisplay();
        this.resetInputs();

        this.modal.style.display = 'block';
        this.adminModule.ui.showOverlay();

        // Focus on first input
        if (this.currentMode === 'absolute') {
            this.newEarned.focus();
        } else {
            this.earnedDelta.focus();
        }
    }

    hide() {
        this.modal.style.display = 'none';
        this.adminModule.ui.showUserManagement();
    }

    isVisible() {
        return this.modal.style.display === 'block';
    }

    updateDisplay() {
        if (!this.currentUser) return;

        this.usernameDisplay.textContent = `Editing credits for ${this.currentUser.username}`;

        const earned = this.currentUser.earnedCredits || 0;
        const claimed = this.currentUser.claimedCredits || 0;
        const available = earned - claimed;

        this.currentEarned.textContent = earned.toLocaleString();
        this.currentClaimed.textContent = claimed.toLocaleString();
        this.currentAvailable.textContent = available.toLocaleString();

        // Set input values
        this.newEarned.value = earned;
        this.newClaimed.value = claimed;
        this.earnedDelta.value = 0;
        this.claimedDelta.value = 0;
    }

    resetInputs() {
        this.newEarned.value = this.currentUser?.earnedCredits || 0;
        this.newClaimed.value = this.currentUser?.claimedCredits || 0;
        this.earnedDelta.value = 0;
        this.claimedDelta.value = 0;

        this.hideWarnings();
        this.updatePreview();
        this.saveBtn.disabled = true;
    }

    switchTab(mode) {
        this.currentMode = mode;

        // Update tab buttons
        this.tabs.forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update panels
        this.panels.forEach(panel => {
            if (panel.id === `${mode}-adjustment`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Reset validation and preview
        if (mode === 'absolute') {
            this.validateAbsoluteInputs();
        } else {
            this.validateRelativeInputs();
        }
    }

    validateAbsoluteInputs() {
        const newEarned = parseInt(this.newEarned.value) || 0;
        const newClaimed = parseInt(this.newClaimed.value) || 0;

        const isValid = newEarned >= 0 && newClaimed >= 0 && newClaimed <= newEarned;

        if (newClaimed > newEarned) {
            this.claimedWarning.style.display = 'block';
        } else {
            this.claimedWarning.style.display = 'none';
        }

        this.saveBtn.disabled = !isValid || (
            newEarned === (this.currentUser?.earnedCredits || 0) &&
            newClaimed === (this.currentUser?.claimedCredits || 0)
        );

        this.updatePreview();
        return isValid;
    }

    validateRelativeInputs() {
        const earnedDelta = parseInt(this.earnedDelta.value) || 0;
        const claimedDelta = parseInt(this.claimedDelta.value) || 0;

        const currentEarned = this.currentUser?.earnedCredits || 0;
        const currentClaimed = this.currentUser?.claimedCredits || 0;

        const newEarned = currentEarned + earnedDelta;
        const newClaimed = currentClaimed + claimedDelta;

        const isValid = newEarned >= 0 && newClaimed >= 0 && newClaimed <= newEarned;

        if (newClaimed > newEarned) {
            this.deltaWarning.style.display = 'block';
        } else {
            this.deltaWarning.style.display = 'none';
        }

        this.saveBtn.disabled = !isValid || (earnedDelta === 0 && claimedDelta === 0);

        this.updatePreview();
        return isValid;
    }

    hideWarnings() {
        this.claimedWarning.style.display = 'none';
        this.deltaWarning.style.display = 'none';
    }

    updatePreview() {
        if (!this.currentUser) return;

        const currentEarned = this.currentUser.earnedCredits || 0;
        const currentClaimed = this.currentUser.claimedCredits || 0;

        let newEarned, newClaimed, changeText;

        if (this.currentMode === 'absolute') {
            newEarned = parseInt(this.newEarned.value) || 0;
            newClaimed = parseInt(this.newClaimed.value) || 0;

            const earnedChange = newEarned - currentEarned;
            const claimedChange = newClaimed - currentClaimed;

            changeText = `
                <div class="preview-item">
                    <span>Earned: ${currentEarned.toLocaleString()} → ${newEarned.toLocaleString()}</span>
                    <span class="preview-change ${earnedChange >= 0 ? 'positive' : 'negative'}">
                        ${earnedChange >= 0 ? '+' : ''}${earnedChange.toLocaleString()}
                    </span>
                </div>
                <div class="preview-item">
                    <span>Claimed: ${currentClaimed.toLocaleString()} → ${newClaimed.toLocaleString()}</span>
                    <span class="preview-change ${claimedChange >= 0 ? 'positive' : 'negative'}">
                        ${claimedChange >= 0 ? '+' : ''}${claimedChange.toLocaleString()}
                    </span>
                </div>
            `;
        } else {
            const earnedDelta = parseInt(this.earnedDelta.value) || 0;
            const claimedDelta = parseInt(this.claimedDelta.value) || 0;

            newEarned = currentEarned + earnedDelta;
            newClaimed = currentClaimed + claimedDelta;

            changeText = `
                <div class="preview-item">
                    <span>Earned: ${currentEarned.toLocaleString()} + ${earnedDelta >= 0 ? '+' : ''}${earnedDelta} = ${newEarned.toLocaleString()}</span>
                </div>
                <div class="preview-item">
                    <span>Claimed: ${currentClaimed.toLocaleString()} + ${claimedDelta >= 0 ? '+' : ''}${claimedDelta} = ${newClaimed.toLocaleString()}</span>
                </div>
            `;
        }

        const newAvailable = newEarned - newClaimed;

        this.preview.innerHTML = `
            ${changeText}
            <div class="preview-summary">
                <strong>New Available Credits:</strong> ${newAvailable.toLocaleString()}
            </div>
        `;
    }

    async saveChanges() {
        if (!this.currentUser) return;

        const payload = {};

        if (this.currentMode === 'absolute') {
            payload.earnedCredits = parseInt(this.newEarned.value) || 0;
            payload.claimedCredits = parseInt(this.newClaimed.value) || 0;
        } else {
            payload.earnedDelta = parseInt(this.earnedDelta.value) || 0;
            payload.claimedDelta = parseInt(this.claimedDelta.value) || 0;
        }

        // Show loading state
        this.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        this.saveBtn.disabled = true;

        try {
            const response = await this.adminModule.auth.makeAuthenticatedRequest(
                `/admin/users/${this.currentUser.id}/credits`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update credits: ${response.status}`);
            }

            const updatedUser = await response.json();
            this.currentUser = updatedUser;

            this.adminModule.ui.showNotification('Credits updated successfully', 'success');
            this.hide();

            // Refresh user list
            this.adminModule.userManager.loadUsers();

        } catch (error) {
            console.error('Error saving credit changes:', error);
            this.adminModule.ui.showNotification(`Failed to update credits: ${error.message}`, 'error');

            // Reset button
            this.saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            this.saveBtn.disabled = false;
        }
    }
}
```

**Step 3: Add credit editor styles**

Append to `src/client/public/css/admin.css`:
```css
/* Credit Editor Styles */
.credit-editor-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.current-credits, .credit-adjustment {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.current-credits h3, .credit-adjustment h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #4cc9f0;
    font-size: 20px;
}

.credit-display {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.credit-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
}

.credit-label {
    color: #a0a0a0;
    font-size: 14px;
}

.credit-value {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
}

.adjustment-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 8px;
}

.tab-btn {
    background: transparent;
    border: none;
    color: #a0a0a0;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
}

.tab-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
}

.tab-btn.active {
    background: rgba(76, 201, 240, 0.1);
    color: #4cc9f0;
    border: 1px solid rgba(76, 201, 240, 0.3);
}

.adjustment-panel {
    display: none;
}

.adjustment-panel.active {
    display: block;
}

.adjustment-panel .form-group {
    margin-bottom: 20px;
}

.adjustment-panel label {
    display: block;
    margin-bottom: 8px;
    color: #a0a0a0;
    font-size: 14px;
    font-weight: 500;
}

.preview-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-section h4 {
    margin-top: 0;
    margin-bottom: 16px;
    color: #a0a0a0;
    font-size: 16px;
}

.preview-display {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
}

.preview-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.preview-change {
    font-weight: 600;
}

.preview-change.positive {
    color: #4ade80;
}

.preview-change.negative {
    color: #f87171;
}

.preview-summary {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    color: #4cc9f0;
}

.editor-actions {
    display: flex;
    gap: 12px;
    margin-top: 32px;
    justify-content: flex-end;
}
```

**Step 4: Test credit editor syntax**

```bash
node -c src/client/public/js/admin/credit-editor.js
```
Expected: No output (syntax OK)

**Step 5: Commit credit editor implementation**

```bash
git add src/client/public/js/admin/credit-editor.js src/client/index.html src/client/public/css/admin.css
git commit -m "feat: implement credit editor component with absolute/relative adjustment modes"
```

---

### Task 6: Implement Multiplier Editor Component

**Files:**
- Create: `src/client/public/js/admin/multiplier-editor.js` (full implementation)
- Modify: `src/client/index.html:361-410` (add multiplier editor modal HTML)
- Modify: `src/client/public/css/admin.css:550-700` (add multiplier editor styles)

**Step 1: Add multiplier editor modal to HTML**

Edit `src/client/index.html` after the credit editor modal (inside admin-overlay div):
```html
        <!-- Multiplier Editor Modal -->
        <div id="admin-multiplier-editor-modal" class="admin-modal" style="display: none;">
            <div class="modal-header">
                <h2><i class="fas fa-chart-line"></i> Edit User Multipliers</h2>
                <p class="modal-subtitle" id="multiplier-editor-username">Loading user...</p>
                <button id="multiplier-editor-back" class="admin-btn btn-outline">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            </div>

            <div class="multiplier-editor-container">
                <div class="multiplier-info">
                    <p><i class="fas fa-info-circle"></i> Multipliers affect credit earnings for each quiz type. Set to 0 to disable a quiz type.</p>
                </div>

                <div class="multiplier-table-container">
                    <table class="multiplier-table">
                        <thead>
                            <tr>
                                <th>Quiz Type</th>
                                <th>Description</th>
                                <th>Current Multiplier</th>
                                <th>New Multiplier</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="multiplier-table-body">
                            <!-- Multiplier rows will be dynamically inserted here -->
                            <tr class="loading-row">
                                <td colspan="5">
                                    <i class="fas fa-spinner fa-spin"></i> Loading multipliers...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="bulk-actions">
                    <h3><i class="fas fa-bolt"></i> Bulk Actions</h3>
                    <div class="bulk-controls">
                        <input type="number" id="bulk-multiplier-value" class="form-input"
                               min="0" max="10" step="0.5" placeholder="Set all to..." value="1">
                        <button id="apply-bulk-multiplier" class="admin-btn">
                            <i class="fas fa-check"></i> Apply to All
                        </button>
                        <button id="reset-multipliers" class="admin-btn btn-outline">
                            <i class="fas fa-undo"></i> Reset to Default (x1)
                        </button>
                    </div>
                </div>

                <div class="editor-actions">
                    <button id="cancel-multiplier-edit" class="admin-btn btn-outline">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button id="save-multiplier-changes" class="admin-btn" disabled>
                        <i class="fas fa-save"></i> Save All Changes
                    </button>
                </div>
            </div>
        </div>
```

**Step 2: Implement multiplier-editor.js**

Create `src/client/public/js/admin/multiplier-editor.js`:
```javascript
export class MultiplierEditor {
    constructor(app, adminModule) {
        this.app = app;
        this.adminModule = adminModule;
        this.currentUser = null;
        this.originalMultipliers = {};
        this.currentMultipliers = {};
        this.quizTypes = [
            { id: 'simple-math', name: 'Multiplication', description: 'Practice multiplication' },
            { id: 'simple-math-2', name: 'Division', description: 'Master division' },
            { id: 'simple-math-3', name: 'Fraction Comparison', description: 'Compare fractions' },
            { id: 'simple-math-4', name: 'BODMAS', description: 'Order of operations' },
            { id: 'simple-math-5', name: 'Factors', description: 'Find factors of numbers' },
            { id: 'simple-words', name: 'Spelling', description: 'Listen and type spelling' }
        ];
        this.initDOMReferences();
        this.initEventListeners();
    }

    initDOMReferences() {
        this.modal = document.getElementById('admin-multiplier-editor-modal');
        this.usernameDisplay = document.getElementById('multiplier-editor-username');
        this.backBtn = document.getElementById('multiplier-editor-back');
        this.cancelBtn = document.getElementById('cancel-multiplier-edit');
        this.saveBtn = document.getElementById('save-multiplier-changes');

        this.tableBody = document.getElementById('multiplier-table-body');

        // Bulk actions
        this.bulkValue = document.getElementById('bulk-multiplier-value');
        this.applyBulkBtn = document.getElementById('apply-bulk-multiplier');
        this.resetBtn = document.getElementById('reset-multipliers');
    }

    initEventListeners() {
        this.backBtn?.addEventListener('click', () => this.hide());
        this.cancelBtn?.addEventListener('click', () => this.hide());
        this.saveBtn?.addEventListener('click', () => this.saveChanges());

        // Bulk actions
        this.applyBulkBtn?.addEventListener('click', () => this.applyBulkMultiplier());
        this.resetBtn?.addEventListener('click', () => this.resetAllToDefault());

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });

        // Event delegation for multiplier input changes
        this.tableBody?.addEventListener('input', (e) => {
            if (e.target.classList.contains('multiplier-input')) {
                this.handleMultiplierInputChange(e.target);
            }
        });
    }

    async show(user) {
        this.currentUser = user;
        this.usernameDisplay.textContent = `Editing multipliers for ${user.username}`;

        this.modal.style.display = 'block';
        this.adminModule.ui.showOverlay();

        await this.loadUserMultipliers();
    }

    hide() {
        this.modal.style.display = 'none';
        this.adminModule.ui.showUserManagement();
    }

    isVisible() {
        return this.modal.style.display === 'block';
    }

    async loadUserMultipliers() {
        try {
            this.showLoading();

            // Fetch current multipliers for this user
            const response = await this.adminModule.auth.makeAuthenticatedRequest(
                `/admin/users/${this.currentUser.id}/multipliers`
            );

            if (!response.ok) {
                throw new Error(`Failed to load multipliers: ${response.status}`);
            }

            const multipliers = await response.json();
            this.originalMultipliers = { ...multipliers };
            this.currentMultipliers = { ...multipliers };

            this.renderMultiplierTable();
            this.updateSaveButtonState();

        } catch (error) {
            console.error('Error loading multipliers:', error);
            this.showError(error.message);
        }
    }

    renderMultiplierTable() {
        if (!this.tableBody) return;

        const rows = this.quizTypes.map(quizType => {
            const currentValue = this.currentMultipliers[quizType.id] || 1;
            const originalValue = this.originalMultipliers[quizType.id] || 1;
            const hasChanged = currentValue !== originalValue;

            return `
                <tr class="multiplier-row ${hasChanged ? 'changed' : ''}" data-quiz-type="${quizType.id}">
                    <td class="quiz-type">
                        <strong>${quizType.name}</strong>
                        <div class="quiz-id">${quizType.id}</div>
                    </td>
                    <td class="quiz-description">${quizType.description}</td>
                    <td class="current-multiplier">${originalValue}x</td>
                    <td class="new-multiplier">
                        <input type="number"
                               class="multiplier-input form-input"
                               value="${currentValue}"
                               min="0"
                               max="10"
                               step="0.5"
                               data-original="${originalValue}">
                        <div class="multiplier-hint">(0 = disabled)</div>
                    </td>
                    <td class="multiplier-actions">
                        ${hasChanged ? `
                            <button class="action-btn revert-btn" title="Revert to original">
                                <i class="fas fa-undo"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        this.tableBody.innerHTML = rows;

        // Add event listeners for revert buttons
        this.tableBody.querySelectorAll('.revert-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('.multiplier-row');
                this.revertMultiplier(row.dataset.quizType);
            });
        });
    }

    showLoading() {
        if (this.tableBody) {
            this.tableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="5">
                        <i class="fas fa-spinner fa-spin"></i> Loading multipliers...
                    </td>
                </tr>
            `;
        }
    }

    showError(message) {
        if (this.tableBody) {
            this.tableBody.innerHTML = `
                <tr class="error-row">
                    <td colspan="5">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>Error loading multipliers</h4>
                            <p>${message}</p>
                            <button id="retry-load-multipliers" class="admin-btn btn-sm">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            document.getElementById('retry-load-multipliers')?.addEventListener('click', () => {
                this.loadUserMultipliers();
            });
        }
    }

    handleMultiplierInputChange(input) {
        const quizType = input.closest('.multiplier-row').dataset.quizType;
        const newValue = parseFloat(input.value);

        if (isNaN(newValue) || newValue < 0) {
            input.value = this.currentMultipliers[quizType] || 1;
            return;
        }

        // Limit to 2 decimal places
        const roundedValue = Math.round(newValue * 100) / 100;
        input.value = roundedValue;

        this.currentMultipliers[quizType] = roundedValue;
        this.updateRowState(quizType);
        this.updateSaveButtonState();
    }

    updateRowState(quizType) {
        const row = this.tableBody.querySelector(`[data-quiz-type="${quizType}"]`);
        if (!row) return;

        const currentValue = this.currentMultipliers[quizType] || 1;
        const originalValue = this.originalMultipliers[quizType] || 1;
        const hasChanged = currentValue !== originalValue;

        if (hasChanged) {
            row.classList.add('changed');

            // Add revert button if not present
            if (!row.querySelector('.revert-btn')) {
                const actionsCell = row.querySelector('.multiplier-actions');
                actionsCell.innerHTML = `
                    <button class="action-btn revert-btn" title="Revert to original">
                        <i class="fas fa-undo"></i>
                    </button>
                `;

                actionsCell.querySelector('.revert-btn').addEventListener('click', () => {
                    this.revertMultiplier(quizType);
                });
            }
        } else {
            row.classList.remove('changed');
            row.querySelector('.multiplier-actions').innerHTML = '';
        }
    }

    revertMultiplier(quizType) {
        const originalValue = this.originalMultipliers[quizType] || 1;
        this.currentMultipliers[quizType] = originalValue;

        const input = this.tableBody.querySelector(`[data-quiz-type="${quizType}"] .multiplier-input`);
        if (input) {
            input.value = originalValue;
        }

        this.updateRowState(quizType);
        this.updateSaveButtonState();
    }

    applyBulkMultiplier() {
        const bulkValue = parseFloat(this.bulkValue.value);

        if (isNaN(bulkValue) || bulkValue < 0) {
            this.adminModule.ui.showNotification('Please enter a valid multiplier value', 'error');
            return;
        }

        // Limit to 2 decimal places
        const roundedValue = Math.round(bulkValue * 100) / 100;

        this.quizTypes.forEach(quizType => {
            this.currentMultipliers[quizType.id] = roundedValue;
        });

        this.renderMultiplierTable();
        this.updateSaveButtonState();

        this.adminModule.ui.showNotification(`All multipliers set to ${roundedValue}x`, 'success');
    }

    resetAllToDefault() {
        this.quizTypes.forEach(quizType => {
            this.currentMultipliers[quizType.id] = 1;
        });

        this.renderMultiplierTable();
        this.updateSaveButtonState();

        this.adminModule.ui.showNotification('All multipliers reset to 1x', 'success');
    }

    updateSaveButtonState() {
        if (!this.saveBtn) return;

        const hasChanges = this.quizTypes.some(quizType => {
            const current = this.currentMultipliers[quizType.id] || 1;
            const original = this.originalMultipliers[quizType.id] || 1;
            return current !== original;
        });

        this.saveBtn.disabled = !hasChanges;
    }

    async saveChanges() {
        if (!this.currentUser) return;

        // Collect changed multipliers
        const updates = [];

        for (const quizType of this.quizTypes) {
            const current = this.currentMultipliers[quizType.id] || 1;
            const original = this.originalMultipliers[quizType.id] || 1;

            if (current !== original) {
                updates.push({
                    quizType: quizType.id,
                    multiplier: current
                });
            }
        }

        if (updates.length === 0) {
            this.adminModule.ui.showNotification('No changes to save', 'info');
            return;
        }

        // Show loading state
        this.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        this.saveBtn.disabled = true;

        try {
            // Save each multiplier individually (API supports single updates)
            for (const update of updates) {
                const response = await this.adminModule.auth.makeAuthenticatedRequest(
                    `/admin/users/${this.currentUser.id}/multiplier`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify(update)
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to update multiplier for ${update.quizType}: ${response.status}`);
                }
            }

            // Update original multipliers to reflect saved state
            this.originalMultipliers = { ...this.currentMultipliers };

            this.adminModule.ui.showNotification(`${updates.length} multiplier(s) updated successfully`, 'success');
            this.hide();

            // Refresh user list
            this.adminModule.userManager.loadUsers();

        } catch (error) {
            console.error('Error saving multiplier changes:', error);
            this.adminModule.ui.showNotification(`Failed to save multipliers: ${error.message}`, 'error');

            // Reset button
            this.saveBtn.innerHTML = '<i class="fas fa-save"></i> Save All Changes';
            this.updateSaveButtonState();
        }
    }
}
```

**Step 3: Add multiplier editor styles**

Append to `src/client/public/css/admin.css`:
```css
/* Multiplier Editor Styles */
.multiplier-editor-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.multiplier-info {
    background: rgba(76, 201, 240, 0.1);
    border: 1px solid rgba(76, 201, 240, 0.3);
    border-radius: 8px;
    padding: 16px;
    color: #a0a0a0;
    font-size: 14px;
}

.multiplier-info i {
    color: #4cc9f0;
    margin-right: 8px;
}

.multiplier-table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.multiplier-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
}

.multiplier-table th {
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
    text-align: left;
    color: #a0a0a0;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.multiplier-table td {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    vertical-align: middle;
}

.multiplier-table tr:last-child td {
    border-bottom: none;
}

.multiplier-table tr:hover {
    background: rgba(255, 255, 255, 0.02);
}

.multiplier-table tr.changed {
    background: rgba(76, 201, 240, 0.05);
    border-left: 3px solid #4cc9f0;
}

.quiz-type {
    min-width: 150px;
}

.quiz-id {
    font-size: 12px;
    color: #a0a0a0;
    margin-top: 4px;
    font-family: monospace;
}

.quiz-description {
    color: #a0a0a0;
    font-size: 14px;
    max-width: 250px;
}

.current-multiplier {
    font-weight: 600;
    color: #ffffff;
    font-size: 18px;
    text-align: center;
    min-width: 100px;
}

.new-multiplier {
    min-width: 150px;
}

.multiplier-input {
    width: 100px;
    text-align: center;
    padding: 8px 12px;
    font-size: 16px;
    font-weight: 500;
}

.multiplier-hint {
    font-size: 12px;
    color: #a0a0a0;
    margin-top: 4px;
}

.multiplier-actions {
    min-width: 80px;
}

.action-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
}

.revert-btn {
    color: #f72585;
    border-color: rgba(247, 37, 133, 0.3);
}

.revert-btn:hover {
    background: rgba(247, 37, 133, 0.1);
    border-color: rgba(247, 37, 133, 0.5);
}

.bulk-actions {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.bulk-actions h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #4cc9f0;
    font-size: 20px;
}

.bulk-controls {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.bulk-controls .form-input {
    width: 150px;
}

.btn-sm {
    padding: 8px 16px;
    font-size: 14px;
}

.loading-row, .error-row {
    text-align: center;
    padding: 40px 20px;
}

.loading-row i, .error-row i {
    font-size: 24px;
    margin-bottom: 16px;
    color: #4cc9f0;
}

.error-row i {
    color: #f72585;
}

.error-row h4 {
    color: #f72585;
    margin-bottom: 8px;
}
```

**Step 4: Test multiplier editor syntax**

```bash
node -c src/client/public/js/admin/multiplier-editor.js
```
Expected: No output (syntax OK)

**Step 5: Commit multiplier editor implementation**

```bash
git add src/client/public/js/admin/multiplier-editor.js src/client/index.html src/client/public/css/admin.css
git commit -m "feat: implement multiplier editor with table view and bulk actions"
```

---

### Task 7: Add Admin Access Trigger and Final Integration

**Files:**
- Modify: `src/client/public/js/main.js:130-140` (add admin trigger button/event)
- Modify: `src/client/index.html:200-210` (add admin access button to UI)
- Modify: `src/client/public/js/admin/admin-main.js:20-40` (add admin trigger method)
- Create: `src/test/admin-ui.test.js` (basic test skeleton)

**Step 1: Add admin access button to dashboard**

Edit `src/client/index.html` in the start-screen div, after the logout button (around line 129-132):
```html
                    <div class="admin-access">
                        <button id="admin-access-btn" class="btn btn-admin" style="display: none;">
                            <i class="fas fa-cogs"></i> Admin Panel
                        </button>
                    </div>
```

Add this after the logout button, inside the dashboard-header div.

**Step 2: Add admin button styles to main CSS**

Check if there's a main CSS file and add styles, or add to admin.css:
```css
/* Admin Access Button */
.btn-admin {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #4cc9f0;
    border: 1px solid rgba(76, 201, 240, 0.3);
}

.btn-admin:hover {
    background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
    border-color: rgba(76, 201, 240, 0.5);
    color: #4cc9f0;
}

.admin-access {
    margin-left: auto;
    margin-right: 12px;
}
```

**Step 3: Add admin trigger to main.js**

Edit `src/client/public/js/main.js` in the `showAuthenticatedScreens` method (or similar):
```javascript
    showAuthenticatedScreens() {
        this.showScreen('start');

        // Show admin button if user is admin
        const adminBtn = document.getElementById('admin-access-btn');
        if (adminBtn && this.currentUser?.isAdmin) {
            adminBtn.style.display = 'block';
            adminBtn.addEventListener('click', () => {
                this.adminModule.showAdminInterface();
            });
        }
    }
```

Also update the `checkAuthentication` method to handle admin state.

**Step 4: Update admin-main.js to expose trigger method**

Ensure `src/client/public/js/admin/admin-main.js` has the `showAdminInterface` method:
```javascript
    showAdminInterface() {
        if (this.auth.isAuthenticated()) {
            this.ui.showUserManagement();
        } else {
            this.ui.showLogin();
        }
    }
```

**Step 5: Create basic test skeleton**

Create `src/test/admin-ui.test.js`:
```javascript
// Admin UI Tests - Basic skeleton
describe('Admin UI Module', () => {
    test('Admin auth module exists', () => {
        expect(typeof AdminAuth).toBe('function');
    });

    test('Admin UI module exists', () => {
        expect(typeof AdminUI).toBe('function');
    });

    // Add more tests as needed
});
```

**Step 6: Test the integration**

```bash
# Check all admin files for syntax errors
for file in src/client/public/js/admin/*.js; do
    node -c "$file" || echo "Syntax error in $file"
done
```
Expected: No syntax errors

**Step 7: Commit final integration**

```bash
git add src/client/public/js/main.js src/client/index.html src/client/public/js/admin/admin-main.js src/test/admin-ui.test.js
git commit -m "feat: integrate admin module with main app and add admin access button"
```

---

### Task 8: Test and Verify Implementation

**Files:**
- Run: Manual testing in browser
- Run: Existing test suite to ensure no regressions
- Create: `e2e/admin-workflow.spec.js` (E2E test for admin workflow)

**Step 1: Build and run the application**

```bash
npm run build
npm start
```
Expected: Build succeeds, server starts

**Step 2: Test admin login flow manually**

1. Open browser to `http://localhost:3000`
2. Log in as admin user (user with `isAdmin: true`)
3. Click "Admin Panel" button
4. Verify admin login modal appears
5. Enter admin credentials (should auto-login if same user)
6. Verify user management modal appears
7. Test user list loading, pagination, search
8. Test credit editor functionality
9. Test multiplier editor functionality
10. Test logout and session management

**Step 3: Run existing tests to ensure no regressions**

```bash
npm test
```
Expected: All existing tests pass

**Step 4: Create E2E test skeleton for admin workflow**

Create `e2e/admin-workflow.spec.js`:
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Admin Workflow', () => {
    test('Admin can log in and view user list', async ({ page }) => {
        // Navigate to app
        await page.goto('http://localhost:3000');

        // Log in as admin (implementation depends on your test setup)
        // ... login steps ...

        // Click admin panel button
        await page.click('#admin-access-btn');

        // Verify admin interface appears
        await expect(page.locator('#admin-overlay')).toBeVisible();
        await expect(page.locator('#admin-user-management-modal')).toBeVisible();

        // Verify user list loads
        await expect(page.locator('.user-list-item').first()).toBeVisible();
    });

    test('Admin can edit user credits', async ({ page }) => {
        // Setup: Log in and navigate to admin
        // ... setup steps ...

        // Click edit credits on first user
        await page.click('.user-list-item:first-child .edit-credits-btn');

        // Verify credit editor appears
        await expect(page.locator('#admin-credit-editor-modal')).toBeVisible();

        // Modify credits and save
        await page.fill('#new-earned', '100');
        await page.fill('#new-claimed', '50');
        await page.click('#save-credit-changes');

        // Verify success notification
        await expect(page.locator('text=Credits updated successfully')).toBeVisible();
    });

    test('Admin can edit user multipliers', async ({ page }) => {
        // Setup: Log in and navigate to admin
        // ... setup steps ...

        // Click edit multipliers on first user
        await page.click('.user-list-item:first-child .edit-multipliers-btn');

        // Verify multiplier editor appears
        await expect(page.locator('#admin-multiplier-editor-modal')).toBeVisible();

        // Modify a multiplier and save
        await page.fill('.multiplier-input:first-child', '2.5');
        await page.click('#save-multiplier-changes');

        // Verify success notification
        await expect(page.locator('text=multiplier(s) updated successfully')).toBeVisible();
    });
});
```

**Step 5: Run E2E tests**

```bash
npx playwright test e2e/admin-workflow.spec.js
```
Expected: Tests may fail initially - this is expected as we're creating test skeleton

**Step 6: Final verification and commit**

```bash
git add e2e/admin-workflow.spec.js
git commit -m "test: add E2E test skeleton for admin workflow"
```

---

## Plan Complete and Ready for Execution

The implementation plan is complete and saved to `docs/plans/2026-01-17-admin-screen-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**