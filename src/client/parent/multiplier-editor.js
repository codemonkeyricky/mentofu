// Multiplier Editor Module - Handles quiz multiplier management
export default class MultiplierEditor {
    constructor(adminModule) {
        this.adminModule = adminModule;
        this.app = adminModule.app;
        this.multipliers = {};
    }

    async loadMultiplierEditor() {
        const tabContent = document.getElementById('parent-multipliers-tab');
        if (!tabContent) return;

        try {
            tabContent.innerHTML = '<div class="parent-loading">Loading multiplier editor...</div>';

            // Load current multipliers
            const data = await this.adminModule.makeAdminRequest('/parent/multipliers');
            this.multipliers = data.multipliers || {};

            this.renderMultiplierEditor();
        } catch (error) {
            console.error('Failed to load multiplier editor:', error);
            tabContent.innerHTML = `
                <div class="parent-error">
                    <p>Failed to load multiplier editor: ${error.message}</p>
                    <button class="parent-btn parent-btn-secondary" onclick="window.adminModule.multiplierEditor.loadMultiplierEditor()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    renderMultiplierEditor() {
        const tabContent = document.getElementById('parent-multipliers-tab');
        if (!tabContent) return;

        const quizTypes = [
            { id: 'math', name: 'Math Quizzes', description: 'All math-based quizzes' },
            { id: 'simple_words', name: 'Words Quiz', description: 'Simple words spelling quiz' }
        ];

        let html = `
            <div class="parent-multipliers-header">
                <h4>Multiplier Management</h4>
                <p class="parent-subtitle">Adjust quiz multipliers for different quiz types</p>
            </div>

            <div class="parent-multiplier-controls">
                <div class="parent-multiplier-grid">
        `;

        quizTypes.forEach(quizType => {
            const currentMultiplier = typeof this.multipliers[quizType.id] === 'number' ? this.multipliers[quizType.id] : 1.0;
            const badgeClass = currentMultiplier > 1.0 ? 'parent-badge-success' : 'parent-badge-info';

            html += `
                    <div class="parent-multiplier-card">
                        <div class="parent-multiplier-card-header">
                            <h5>${quizType.name}</h5>
                            <span class="parent-badge ${badgeClass}">x${currentMultiplier.toFixed(1)}</span>
                        </div>
                        <div class="parent-multiplier-card-body">
                            <p class="parent-multiplier-description">${quizType.description}</p>

                            <div class="parent-form-group">
                                <label for="multiplier-${quizType.id}">Multiplier Value</label>
                                <div class="parent-input-with-slider">
                                    <input type="range" id="multiplier-slider-${quizType.id}"
                                           class="parent-slider" min="0" max="5" step="1"
                                           value="${currentMultiplier}">
                                    <input type="number" id="multiplier-${quizType.id}"
                                           class="parent-input parent-input-sm"
                                           min="0" max="5" step="1" value="${currentMultiplier}">
                                </div>
                                <div class="parent-slider-labels">
                                    <span>0x</span>
                                    <span>1x</span>
                                    <span>2x</span>
                                    <span>3x</span>
                                    <span>4x</span>
                                    <span>5x</span>
                                </div>
                            </div>

                            <div class="parent-form-group">
                                <label for="multiplier-action-${quizType.id}">Apply To</label>
                                <select id="multiplier-action-${quizType.id}" class="parent-select">
                                    <option value="all">All users</option>
                                    <option value="verified">Verified users only</option>
                                    <option value="unverified">Unverified users only</option>
                                </select>
                            </div>

                            <button class="parent-btn parent-btn-primary update-multiplier-btn"
                                    data-quiz-type="${quizType.id}">
                                <i class="fas fa-sync-alt"></i> Update Multiplier
                            </button>
                        </div>
                    </div>
            `;
        });

        html += `
                </div>

                <div class="parent-multiplier-bulk">
                    <div class="parent-form-card">
                        <h5>Bulk Multiplier Operations</h5>

                        <div class="parent-form-group">
                            <label for="bulk-multiplier-action">Action</label>
                            <select id="bulk-multiplier-action" class="parent-select">
                                <option value="reset-all">Reset all to 1.0x</option>
                                <option value="increase-all">Increase all by 0.5x</option>
                                <option value="decrease-all">Decrease all by 0.5x</option>
                                <option value="set-all">Set all to specific value</option>
                            </select>
                        </div>

                        <div class="parent-form-group" id="bulk-multiplier-value-group" style="display: none;">
                            <label for="bulk-multiplier-value">Value</label>
                            <input type="number" id="bulk-multiplier-value" class="parent-input"
                                   min="0" max="5" step="1" value="1">
                        </div>

                        <div class="parent-form-group">
                            <label for="bulk-multiplier-target">Target Users</label>
                            <select id="bulk-multiplier-target" class="parent-select">
                                <option value="all">All users</option>
                                <option value="verified">Verified users only</option>
                                <option value="unverified">Unverified users only</option>
                            </select>
                        </div>

                        <button id="execute-bulk-multiplier-btn" class="parent-btn parent-btn-warning">
                            <i class="fas fa-bolt"></i> Execute Bulk Operation
                        </button>
                    </div>
                </div>

                <div class="parent-multiplier-history">
                    <h5>Multiplier Change History</h5>
                    <div class="parent-table-container">
                        <table class="parent-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Quiz Type</th>
                                    <th>Old Value</th>
                                    <th>New Value</th>
                                    <th>Target</th>
                                    <th>Admin</th>
                                </tr>
                            </thead>
                            <tbody id="multiplier-history-body">
                                <!-- History will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        tabContent.innerHTML = html;
        this.setupMultiplierEditorEventListeners();
        this.loadMultiplierHistory();
    }

    setupMultiplierEditorEventListeners() {
        // Sync slider and number input for each quiz type
        const quizTypes = ['math', 'simple_words'];

        quizTypes.forEach(quizType => {
            const slider = document.getElementById(`multiplier-slider-${quizType}`);
            const numberInput = document.getElementById(`multiplier-${quizType}`);

            if (slider && numberInput) {
                slider.addEventListener('input', () => {
                    numberInput.value = slider.value;
                });

                numberInput.addEventListener('input', () => {
                    let value = parseFloat(numberInput.value);
                    if (isNaN(value)) value = 1.0;
                    if (value < 0.1) value = 0.1;
                    if (value > 5.0) value = 5.0;

                    slider.value = value;
                    numberInput.value = value;
                });
            }

            // Update multiplier button
            const updateBtn = document.querySelector(`.update-multiplier-btn[data-quiz-type="${quizType}"]`);
            if (updateBtn) {
                updateBtn.addEventListener('click', async () => {
                    const value = parseFloat(document.getElementById(`multiplier-${quizType}`).value);
                    const action = document.getElementById(`multiplier-action-${quizType}`).value;
                    await this.updateMultiplier(quizType, value, action);
                });
            }
        });

        // Bulk operation visibility
        const bulkAction = document.getElementById('bulk-multiplier-action');
        if (bulkAction) {
            bulkAction.addEventListener('change', (e) => {
                const valueGroup = document.getElementById('bulk-multiplier-value-group');
                if (e.target.value === 'set-all') {
                    valueGroup.style.display = 'block';
                } else {
                    valueGroup.style.display = 'none';
                }
            });
        }

        // Execute bulk multiplier operation
        const executeBulkBtn = document.getElementById('execute-bulk-multiplier-btn');
        if (executeBulkBtn) {
            executeBulkBtn.addEventListener('click', async () => {
                const action = bulkAction.value;
                const target = document.getElementById('bulk-multiplier-target').value;
                const value = action === 'set-all' ?
                    parseFloat(document.getElementById('bulk-multiplier-value').value) : 0;

                if (action === 'set-all' && (isNaN(value) || value < 0 || value > 5)) {
                    this.app.showNotification('Please enter a valid multiplier value (0-5)', 'warning');
                    return;
                }

                if (confirm(`Are you sure you want to perform bulk multiplier operation: ${action}?`)) {
                    await this.executeBulkMultiplierOperation(action, target, value);
                }
            });
        }
    }

    async updateMultiplier(quizType, value, target) {
        if (isNaN(value) || value < 0 || value > 5) {
            this.app.showNotification('Please enter a valid multiplier value (0-5)', 'warning');
            return;
        }

        try {
            const response = await this.adminModule.makeAdminRequest(
                `/parent/multipliers/${quizType}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ value, target })
                }
            );

            if (response.success) {
                this.app.showNotification(
                    `${this.getQuizTypeName(quizType)} multiplier updated to x${value}`,
                    'success'
                );

                // Update local cache
                this.multipliers[quizType] = value;

                // Refresh the UI to show updated badge
                this.loadMultiplierEditor();
            }
        } catch (error) {
            console.error('Failed to update multiplier:', error);
            this.app.showNotification(`Failed to update multiplier: ${error.message}`, 'error');
        }
    }

    async executeBulkMultiplierOperation(action, target, value = 0) {
        try {
            let endpoint, body;

            switch (action) {
                case 'reset-all':
                    endpoint = '/parent/multipliers/bulk/reset';
                    body = { target };
                    break;
                case 'increase-all':
                    endpoint = '/parent/multipliers/bulk/increase';
                    body = { target, amount: 1 };
                    break;
                case 'decrease-all':
                    endpoint = '/parent/multipliers/bulk/decrease';
                    body = { target, amount: 1 };
                    break;
                case 'set-all':
                    endpoint = '/parent/multipliers/bulk/set';
                    body = { target, value };
                    break;
                default:
                    throw new Error('Invalid bulk multiplier operation');
            }

            const response = await this.adminModule.makeAdminRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (response.success) {
                this.app.showNotification(`Bulk multiplier operation "${action}" completed successfully`, 'success');
                // Refresh the multiplier editor to show updated data
                await this.loadMultiplierEditor();
            }
        } catch (error) {
            console.error('Failed to execute bulk multiplier operation:', error);
            this.app.showNotification(`Failed to execute bulk operation: ${error.message}`, 'error');
        }
    }

    async loadMultiplierHistory() {
        try {
            const historyData = await this.adminModule.makeAdminRequest('/parent/multipliers/history');
            const historyBody = document.getElementById('multiplier-history-body');

            if (historyBody && historyData.history) {
                historyBody.innerHTML = '';

                if (historyData.history.length > 0) {
                    // Show only last 10 entries
                    const recentHistory = historyData.history.slice(0, 10);

                    recentHistory.forEach(entry => {
                        const date = new Date(entry.timestamp).toLocaleString();
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${date}</td>
                            <td>${this.getQuizTypeName(entry.quizType)}</td>
                            <td>x${entry.oldValue.toFixed(1)}</td>
                            <td>x${entry.newValue.toFixed(1)}</td>
                            <td><span class="parent-badge ${this.getTargetBadgeClass(entry.target)}">
                                ${entry.target}
                            </span></td>
                            <td>${entry.adminUsername || 'System'}</td>
                        `;
                        historyBody.appendChild(row);
                    });
                } else {
                    historyBody.innerHTML = '<tr><td colspan="6" class="text-center">No multiplier history found</td></tr>';
                }
            }
        } catch (error) {
            console.error('Failed to load multiplier history:', error);
            // Don't show error for history - it's non-critical
        }
    }

    getQuizTypeName(quizType) {
        const names = {
            'math': 'Math Quizzes',
            'simple_words': 'Words Quiz'
        };
        return names[quizType] || quizType;
    }

    getTargetBadgeClass(target) {
        const classes = {
            'all': 'parent-badge-info',
            'verified': 'parent-badge-success',
            'unverified': 'parent-badge-warning'
        };
        return classes[target] || 'parent-badge-secondary';
    }
}