# Admin Screen UI Implementation - Task 6: Implement Multiplier Editor Component

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Multiplier Editor Component

**Architecture:** Admin interface appears as modal overlay on main quiz app with separate admin login, distinct dark styling, and integration with existing admin API endpoints. Uses sessionStorage for admin JWT tokens and follows existing fetch patterns.

**Tech Stack:** Vanilla JavaScript ES6 modules, CSS for admin styling, existing Three.js background, Chart.js for optional stats.

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

**Note:** This is Task 6 of 8 from the comprehensive admin screen implementation plan. For the full plan, see `docs/plans/2026-01-17-admin-screen-implementation.md`.