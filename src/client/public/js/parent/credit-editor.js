// Credit Editor Module - Handles user credit management
export default class CreditEditor {
    constructor(adminModule) {
        this.adminModule = adminModule;
        this.app = adminModule.app;
    }

    async loadCreditEditor() {
        const tabContent = document.getElementById('parent-credits-tab');
        if (!tabContent) return;

        try {
            tabContent.innerHTML = '<div class="parent-loading">Loading credit editor...</div>';

            // Load users for the dropdown
            const usersData = await this.adminModule.makeAdminRequest('/parent/users');
            const users = usersData.users || [];

            this.renderCreditEditor(users);
        } catch (error) {
            console.error('Failed to load credit editor:', error);
            tabContent.innerHTML = `
                <div class="parent-error">
                    <p>Failed to load credit editor: ${error.message}</p>
                    <button class="parent-btn parent-btn-secondary" onclick="window.adminModule.creditEditor.loadCreditEditor()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    renderCreditEditor(users) {
        const tabContent = document.getElementById('parent-credits-tab');
        if (!tabContent) return;

        let html = `
            <div class="parent-credits-header">
                <h4>Credit Management</h4>
                <p class="parent-subtitle">Adjust earned and claimed credits for users</p>
            </div>

            <div class="parent-credit-controls">
                <div class="parent-form-group">
                    <label for="credit-user-select">Select User</label>
                    <select id="credit-user-select" class="parent-select">
                        <option value="">-- Select a user --</option>
        `;

        users.forEach(user => {
            html += `<option value="${user.id}">${user.username} (ID: ${user.id})</option>`;
        });

        html += `
                    </select>
                </div>

                <div class="parent-credit-stats" id="credit-user-stats" style="display: none;">
                    <div class="parent-stat-card">
                        <h5>Current Credits</h5>
                        <div class="parent-stat-grid">
                            <div class="parent-stat-item">
                                <span class="parent-stat-label">Earned:</span>
                                <span class="parent-stat-value" id="current-earned">0</span>
                            </div>
                            <div class="parent-stat-item">
                                <span class="parent-stat-label">Claimed:</span>
                                <span class="parent-stat-value" id="current-claimed">0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="parent-credit-forms">
                    <div class="parent-form-card">
                        <h5>Adjust Earned Credits</h5>
                        <div class="parent-form-group">
                            <label for="earned-action">Action</label>
                            <select id="earned-action" class="parent-select">
                                <option value="set">Set to specific value</option>
                                <option value="add">Add amount</option>
                                <option value="subtract">Subtract amount</option>
                            </select>
                        </div>
                        <div class="parent-form-group">
                            <label for="earned-amount">Amount</label>
                            <input type="number" id="earned-amount" class="parent-input" min="0" step="1" value="0">
                        </div>
                        <button id="adjust-earned-btn" class="parent-btn parent-btn-primary" disabled>
                            <i class="fas fa-coins"></i> Adjust Earned Credits
                        </button>
                    </div>

                    <div class="parent-form-card">
                        <h5>Adjust Claimed Credits</h5>
                        <div class="parent-form-group">
                            <label for="claimed-action">Action</label>
                            <select id="claimed-action" class="parent-select">
                                <option value="set">Set to specific value</option>
                                <option value="add">Add amount</option>
                                <option value="subtract">Subtract amount</option>
                            </select>
                        </div>
                        <div class="parent-form-group">
                            <label for="claimed-amount">Amount</label>
                            <input type="number" id="claimed-amount" class="parent-input" min="0" step="1" value="0">
                        </div>
                        <button id="adjust-claimed-btn" class="parent-btn parent-btn-primary" disabled>
                            <i class="fas fa-hand-holding-usd"></i> Adjust Claimed Credits
                        </button>
                    </div>
                </div>

                <div class="parent-bulk-actions">
                    <h5>Bulk Operations</h5>
                    <div class="parent-form-group">
                        <label for="bulk-action">Action</label>
                        <select id="bulk-action" class="parent-select">
                            <option value="add-earned">Add earned credits to all users</option>
                            <option value="reset-claimed">Reset claimed credits for all users</option>
                            <option value="sync-earned">Sync earned credits from sessions</option>
                        </select>
                    </div>
                    <div class="parent-form-group" id="bulk-amount-group" style="display: none;">
                        <label for="bulk-amount">Amount</label>
                        <input type="number" id="bulk-amount" class="parent-input" min="0" step="1" value="0">
                    </div>
                    <button id="execute-bulk-btn" class="parent-btn parent-btn-warning">
                        <i class="fas fa-bolt"></i> Execute Bulk Operation
                    </button>
                </div>
            </div>

            <div class="parent-credit-history" id="credit-history" style="display: none;">
                <h5>Recent Credit Adjustments</h5>
                <div class="parent-table-container">
                    <table class="parent-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Action</th>
                                <th>Amount</th>
                                <th>Admin</th>
                            </tr>
                        </thead>
                        <tbody id="credit-history-body">
                            <!-- History will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        tabContent.innerHTML = html;
        this.setupCreditEditorEventListeners(users);
    }

    setupCreditEditorEventListeners(users) {
        const userSelect = document.getElementById('credit-user-select');
        const earnedAction = document.getElementById('earned-action');
        const claimedAction = document.getElementById('claimed-action');
        const bulkAction = document.getElementById('bulk-action');

        // User selection
        if (userSelect) {
            userSelect.addEventListener('change', async (e) => {
                const userId = e.target.value;
                if (userId) {
                    await this.loadUserCreditStats(userId);
                } else {
                    this.hideUserStats();
                }
            });
        }

        // Adjust earned credits
        const adjustEarnedBtn = document.getElementById('adjust-earned-btn');
        if (adjustEarnedBtn) {
            adjustEarnedBtn.addEventListener('click', async () => {
                const userId = userSelect.value;
                if (!userId) {
                    this.app.showNotification('Please select a user first', 'warning');
                    return;
                }

                const action = earnedAction.value;
                const amount = parseInt(document.getElementById('earned-amount').value);
                await this.adjustCredits(userId, 'earned', action, amount);
            });
        }

        // Adjust claimed credits
        const adjustClaimedBtn = document.getElementById('adjust-claimed-btn');
        if (adjustClaimedBtn) {
            adjustClaimedBtn.addEventListener('click', async () => {
                const userId = userSelect.value;
                if (!userId) {
                    this.app.showNotification('Please select a user first', 'warning');
                    return;
                }

                const action = claimedAction.value;
                const amount = parseInt(document.getElementById('claimed-amount').value);
                await this.adjustCredits(userId, 'claimed', action, amount);
            });
        }

        // Bulk action visibility
        if (bulkAction) {
            bulkAction.addEventListener('change', (e) => {
                const bulkAmountGroup = document.getElementById('bulk-amount-group');
                if (e.target.value === 'add-earned') {
                    bulkAmountGroup.style.display = 'block';
                } else {
                    bulkAmountGroup.style.display = 'none';
                }
            });
        }

        // Execute bulk operation
        const executeBulkBtn = document.getElementById('execute-bulk-btn');
        if (executeBulkBtn) {
            executeBulkBtn.addEventListener('click', async () => {
                const action = bulkAction.value;
                const amount = action === 'add-earned' ? parseInt(document.getElementById('bulk-amount').value) : 0;

                if (action === 'add-earned' && (isNaN(amount) || amount <= 0)) {
                    this.app.showNotification('Please enter a valid amount for bulk operation', 'warning');
                    return;
                }

                if (confirm(`Are you sure you want to perform bulk operation: ${action}?`)) {
                    await this.executeBulkOperation(action, amount);
                }
            });
        }
    }

    async loadUserCreditStats(userId) {
        try {
            const userData = await this.adminModule.makeAdminRequest(`/parent/users/${userId}/credits`);
            const statsElement = document.getElementById('credit-user-stats');
            const adjustEarnedBtn = document.getElementById('adjust-earned-btn');
            const adjustClaimedBtn = document.getElementById('adjust-claimed-btn');

            if (statsElement && userData) {
                statsElement.style.display = 'block';
                document.getElementById('current-earned').textContent = userData.earnedCredits || 0;
                document.getElementById('current-claimed').textContent = userData.claimedCredits || 0;

                // Enable adjustment buttons
                if (adjustEarnedBtn) adjustEarnedBtn.disabled = false;
                if (adjustClaimedBtn) adjustClaimedBtn.disabled = false;

                // Load credit history
                await this.loadCreditHistory(userId);
            }
        } catch (error) {
            console.error('Failed to load user credit stats:', error);
            this.app.showNotification(`Failed to load user credit stats: ${error.message}`, 'error');
        }
    }

    hideUserStats() {
        const statsElement = document.getElementById('credit-user-stats');
        const adjustEarnedBtn = document.getElementById('adjust-earned-btn');
        const adjustClaimedBtn = document.getElementById('adjust-claimed-btn');
        const historyElement = document.getElementById('credit-history');

        if (statsElement) statsElement.style.display = 'none';
        if (adjustEarnedBtn) adjustEarnedBtn.disabled = true;
        if (adjustClaimedBtn) adjustClaimedBtn.disabled = true;
        if (historyElement) historyElement.style.display = 'none';
    }

    async adjustCredits(userId, creditType, action, amount) {
        if (isNaN(amount) || amount < 0) {
            this.app.showNotification('Please enter a valid amount', 'warning');
            return;
        }

        try {
            const response = await this.adminModule.makeAdminRequest(
                `/parent/users/${userId}/credits/${creditType}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ action, amount })
                }
            );

            if (response.success) {
                this.app.showNotification(
                    `${creditType.charAt(0).toUpperCase() + creditType.slice(1)} credits ${action} by ${amount} successfully`,
                    'success'
                );

                // Refresh user stats
                await this.loadUserCreditStats(userId);

                // Clear amount fields
                if (creditType === 'earned') {
                    document.getElementById('earned-amount').value = '0';
                } else {
                    document.getElementById('claimed-amount').value = '0';
                }
            }
        } catch (error) {
            console.error(`Failed to adjust ${creditType} credits:`, error);
            this.app.showNotification(`Failed to adjust credits: ${error.message}`, 'error');
        }
    }

    async loadCreditHistory(userId) {
        try {
            const historyData = await this.adminModule.makeAdminRequest(`/parent/users/${userId}/credits/history`);
            const historyElement = document.getElementById('credit-history');
            const historyBody = document.getElementById('credit-history-body');

            if (historyElement && historyBody) {
                historyElement.style.display = 'block';
                historyBody.innerHTML = '';

                if (historyData.history && historyData.history.length > 0) {
                    historyData.history.forEach(entry => {
                        const date = new Date(entry.timestamp).toLocaleString();
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${date}</td>
                            <td><span class="parent-badge ${entry.creditType === 'earned' ? 'parent-badge-info' : 'parent-badge-success'}">
                                ${entry.creditType}
                            </span></td>
                            <td>${entry.action}</td>
                            <td>${entry.amount}</td>
                            <td>${entry.adminUsername || 'System'}</td>
                        `;
                        historyBody.appendChild(row);
                    });
                } else {
                    historyBody.innerHTML = '<tr><td colspan="5" class="text-center">No credit history found</td></tr>';
                }
            }
        } catch (error) {
            console.error('Failed to load credit history:', error);
            // Don't show error for history - it's non-critical
        }
    }

    async executeBulkOperation(action, amount = 0) {
        try {
            let endpoint, body;

            switch (action) {
                case 'add-earned':
                    endpoint = '/parent/credits/bulk/add-earned';
                    body = { amount };
                    break;
                case 'reset-claimed':
                    endpoint = '/parent/credits/bulk/reset-claimed';
                    body = {};
                    break;
                case 'sync-earned':
                    endpoint = '/parent/credits/bulk/sync-earned';
                    body = {};
                    break;
                default:
                    throw new Error('Invalid bulk operation');
            }

            const response = await this.adminModule.makeAdminRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (response.success) {
                this.app.showNotification(`Bulk operation "${action}" completed successfully`, 'success');
                // Refresh the credit editor to show updated data
                await this.loadCreditEditor();
            }
        } catch (error) {
            console.error('Failed to execute bulk operation:', error);
            this.app.showNotification(`Failed to execute bulk operation: ${error.message}`, 'error');
        }
    }
}