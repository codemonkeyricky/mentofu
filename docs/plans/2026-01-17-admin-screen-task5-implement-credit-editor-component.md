# Admin Screen UI Implementation - Task 5: Implement Credit Editor Component

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Credit Editor Component

**Architecture:** Admin interface appears as modal overlay on main quiz app with separate admin login, distinct dark styling, and integration with existing admin API endpoints. Uses sessionStorage for admin JWT tokens and follows existing fetch patterns.

**Tech Stack:** Vanilla JavaScript ES6 modules, CSS for admin styling, existing Three.js background, Chart.js for optional stats.

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

**Note:** This is Task 5 of 8 from the comprehensive admin screen implementation plan. For the full plan, see `docs/plans/2026-01-17-admin-screen-implementation.md`.