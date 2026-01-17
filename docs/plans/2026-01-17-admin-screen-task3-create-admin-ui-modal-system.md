# Admin Screen UI Implementation - Task 3: Create Admin UI Modal System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create Admin UI Modal System

**Architecture:** Admin interface appears as modal overlay on main quiz app with separate admin login, distinct dark styling, and integration with existing admin API endpoints. Uses sessionStorage for admin JWT tokens and follows existing fetch patterns.

**Tech Stack:** Vanilla JavaScript ES6 modules, CSS for admin styling, existing Three.js background, Chart.js for optional stats.

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

**Note:** This is Task 3 of 8 from the comprehensive admin screen implementation plan. For the full plan, see `docs/plans/2026-01-17-admin-screen-implementation.md`.