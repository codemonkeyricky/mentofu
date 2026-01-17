# Admin Screen UI Implementation - Task 4: Implement User Manager Module

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement User Manager Module

**Architecture:** Admin interface appears as modal overlay on main quiz app with separate admin login, distinct dark styling, and integration with existing admin API endpoints. Uses sessionStorage for admin JWT tokens and follows existing fetch patterns.

**Tech Stack:** Vanilla JavaScript ES6 modules, CSS for admin styling, existing Three.js background, Chart.js for optional stats.

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

**Note:** This is Task 4 of 8 from the comprehensive admin screen implementation plan. For the full plan, see `docs/plans/2026-01-17-admin-screen-implementation.md`.