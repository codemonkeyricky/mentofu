# Admin Screen UI Implementation - Task 2: Implement Admin Authentication Module

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Admin Authentication Module

**Architecture:** Admin interface appears as modal overlay on main quiz app with separate admin login, distinct dark styling, and integration with existing admin API endpoints. Uses sessionStorage for admin JWT tokens and follows existing fetch patterns.

**Tech Stack:** Vanilla JavaScript ES6 modules, CSS for admin styling, existing Three.js background, Chart.js for optional stats.

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

**Note:** This is Task 2 of 8 from the comprehensive admin screen implementation plan. For the full plan, see `docs/plans/2026-01-17-admin-screen-implementation.md`.