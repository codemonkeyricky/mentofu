// User Manager Module - Handles user management operations
export default class UserManager {
    constructor(adminModule) {
        this.adminModule = adminModule;
        this.app = adminModule.app;
        this.users = [];
    }

    async loadUsers() {
        const tabContent = document.getElementById('parent-users-tab');
        if (!tabContent) return;

        try {
            tabContent.innerHTML = '<div class="parent-loading">Loading users...</div>';

            const data = await this.adminModule.makeAdminRequest('/parent/users');
            this.users = data.users || [];

            this.renderUsersTable();
        } catch (error) {
            console.error('Failed to load users:', error);
            tabContent.innerHTML = `
                <div class="parent-error">
                    <p>Failed to load users: ${error.message}</p>
                    <button class="parent-btn parent-btn-secondary" onclick="window.adminModule.userManager.loadUsers()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    renderUsersTable() {
        const tabContent = document.getElementById('parent-users-tab');
        if (!tabContent) return;

        if (this.users.length === 0) {
            tabContent.innerHTML = '<div class="parent-empty">No users found</div>';
            return;
        }

        let html = `
            <div class="parent-users-header">
                <h4>User Management (${this.users.length} users)</h4>
                <div class="parent-search-box">
                    <input type="text" id="parent-user-search" placeholder="Search users...">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            <div class="parent-table-container">
                <table class="parent-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Created</th>
                            <th>Earned Credits</th>
                            <th>Claimed Credits</th>
                            <th>Verified</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.users.forEach(user => {
            const createdDate = new Date(user.createdAt).toLocaleDateString();
            const isVerified = user.isVerified ? 'Yes' : 'No';
            const verifiedClass = user.isVerified ? 'parent-badge-success' : 'parent-badge-warning';

            html += `
                <tr data-user-id="${user.id}">
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${createdDate}</td>
                    <td>${user.earnedCredits || 0}</td>
                    <td>${user.claimedCredits || 0}</td>
                    <td><span class="parent-badge ${verifiedClass}">${isVerified}</span></td>
                    <td>
                        <div class="parent-action-buttons">
                            <button class="parent-btn parent-btn-sm parent-btn-info edit-user-btn"
                                    data-user-id="${user.id}" title="Edit User">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="parent-btn parent-btn-sm parent-btn-warning toggle-verify-btn"
                                    data-user-id="${user.id}" title="${user.isVerified ? 'Unverify' : 'Verify'}">
                                <i class="fas ${user.isVerified ? 'fa-times-circle' : 'fa-check-circle'}"></i>
                            </button>
                            <button class="parent-btn parent-btn-sm parent-btn-danger delete-user-btn"
                                    data-user-id="${user.id}" title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        tabContent.innerHTML = html;
        this.setupUserTableEventListeners();
    }

    setupUserTableEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('parent-user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterUsers(e.target.value));
        }

        // Edit user buttons
        const editButtons = document.querySelectorAll('.edit-user-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.userId;
                this.editUser(userId);
            });
        });

        // Toggle verify buttons
        const verifyButtons = document.querySelectorAll('.toggle-verify-btn');
        verifyButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.currentTarget.dataset.userId;
                await this.toggleUserVerification(userId);
            });
        });

        // Delete user buttons
        const deleteButtons = document.querySelectorAll('.delete-user-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.currentTarget.dataset.userId;
                await this.deleteUser(userId);
            });
        });
    }

    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#parent-users-tab tbody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const username = row.cells[1].textContent.toLowerCase();
            const userId = row.cells[0].textContent.toLowerCase();
            const isVisible = username.includes(term) || userId.includes(term);
            row.style.display = isVisible ? '' : 'none';
        });
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        // For now, show a simple edit form
        // In a real implementation, this would open a modal with full user editing
        this.app.showNotification(`Edit user ${user.username} - Feature coming soon`, 'info');
    }

    async toggleUserVerification(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        try {
            const newVerifiedState = !user.isVerified;
            const response = await this.adminModule.makeAdminRequest(
                `/parent/users/${userId}/verify`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ verified: newVerifiedState })
                }
            );

            if (response.success) {
                user.isVerified = newVerifiedState;
                this.renderUsersTable();
                this.app.showNotification(
                    `User ${user.username} ${newVerifiedState ? 'verified' : 'unverified'} successfully`,
                    'success'
                );
            }
        } catch (error) {
            console.error('Failed to toggle user verification:', error);
            this.app.showNotification(`Failed to update user verification: ${error.message}`, 'error');
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await this.adminModule.makeAdminRequest(
                `/parent/users/${userId}`,
                { method: 'DELETE' }
            );

            if (response.success) {
                this.users = this.users.filter(u => u.id != userId);
                this.renderUsersTable();
                this.app.showNotification(`User ${user.username} deleted successfully`, 'success');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            this.app.showNotification(`Failed to delete user: ${error.message}`, 'error');
        }
    }

    async createUser(username, password) {
        try {
            const response = await this.adminModule.makeAdminRequest('/parent/users', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (response.success) {
                this.app.showNotification(`User ${username} created successfully`, 'success');
                await this.loadUsers(); // Refresh the user list
                return true;
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            this.app.showNotification(`Failed to create user: ${error.message}`, 'error');
            return false;
        }
    }
}