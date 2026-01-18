# Parent Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When users log in with `isParent: true`, redirect them to a parent dashboard where they can view and edit quiz multipliers for students.

**Architecture:** Hybrid approach using existing vanilla JS screen switching system with React component mounted in container. Modify login flow to check `isParent` flag and show parent-dashboard screen. Update ParentDashboard React component to fetch real data from API and implement multiplier editing.

**Tech Stack:** Vanilla JavaScript, React (TypeScript), REST API (JWT authentication), CSS

---

### Task 1: Copy ParentDashboard.tsx to worktree

**Files:**
- Copy: `/home/richard/dev/quiz/src/client/components/ParentDashboard.tsx` → `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/components/ParentDashboard.tsx`

**Step 1: Create directory if needed**

```bash
mkdir -p /home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/components
```

**Step 2: Copy file**

```bash
cp /home/richard/dev/quiz/src/client/components/ParentDashboard.tsx /home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/components/ParentDashboard.tsx
```

**Step 3: Verify copy**

```bash
ls -la /home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/components/ParentDashboard.tsx
```

Expected: File exists with size > 0 bytes

**Step 4: Commit**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
git add src/client/components/ParentDashboard.tsx
git commit -m "feat: add ParentDashboard component to worktree"
```

---

### Task 2: Add parent-dashboard screen to HTML

**Files:**
- Modify: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/index.html`

**Step 1: Find where to add screen**

Find the screen section (after claim-credit-screen). Look for `<!-- Claim Credit Screen -->` or `id="claim-credit-screen"`.

**Step 2: Add parent-dashboard screen HTML**

Add after claim-credit-screen div:

```html
<!-- Parent Dashboard Screen -->
<div id="parent-dashboard-screen" class="screen">
    <div class="glass-card dashboard-card">
        <div class="card-header">
            <h2><i class="fas fa-users-cog"></i> Parent Dashboard</h2>
            <p class="card-subtitle">Manage student accounts and multipliers</p>
        </div>
        <div id="parent-dashboard-container"></div>
        <div class="dashboard-actions">
            <button id="back-to-start-from-parent" class="btn btn-outline">
                <i class="fas fa-arrow-left"></i> Back to Start
            </button>
            <button id="parent-logout-btn" class="btn btn-logout">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
    </div>
</div>
```

**Step 3: Verify HTML syntax**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
npm run build:client 2>&1 | head -20
```

Expected: No syntax errors, build succeeds

**Step 4: Commit**

```bash
git add src/client/index.html
git commit -m "feat: add parent-dashboard screen to HTML"
```

---

### Task 3: Update main.js screens object

**Files:**
- Modify: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/public/js/main.js:22-31`

**Step 1: Find screens object**

Line 22: `this.screens = {`

**Step 2: Add parent-dashboard to screens object**

Add `parentDashboard: document.getElementById('parent-dashboard-screen'),` after claimCredit entry.

```javascript
this.screens = {
    auth: document.getElementById('auth-screen'),
    login: document.getElementById('login-screen'),
    register: document.getElementById('register-screen'),
    start: document.getElementById('start-screen'),
    quiz: document.getElementById('quiz-screen'),
    words: document.getElementById('simple-words-screen'),
    results: document.getElementById('results-screen'),
    claimCredit: document.getElementById('claim-credit-screen'),
    parentDashboard: document.getElementById('parent-dashboard-screen') // NEW
};
```

**Step 3: Verify syntax**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
node -c src/client/public/js/main.js
```

Expected: No syntax errors

**Step 4: Commit**

```bash
git add src/client/public/js/main.js
git commit -m "feat: add parentDashboard screen to screens object"
```

---

### Task 4: Add event listeners for parent dashboard buttons

**Files:**
- Modify: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/public/js/main.js:95-172`

**Step 1: Find initEventListeners method**

**Step 2: Add event listeners for parent dashboard buttons**

Add after existing button listeners (around line 150-152):

```javascript
// Parent dashboard buttons
document.getElementById('back-to-start-from-parent')?.addEventListener('click', () => {
    this.showScreen('start');
});

document.getElementById('parent-logout-btn')?.addEventListener('click', () => {
    this.logoutUser();
});
```

**Step 3: Verify syntax**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
node -c src/client/public/js/main.js
```

Expected: No syntax errors

**Step 4: Commit**

```bash
git add src/client/public/js/main.js
git commit -m "feat: add event listeners for parent dashboard buttons"
```

---

### Task 5: Modify login flow to check isParent flag

**Files:**
- Modify: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/public/js/main.js:293-333`

**Step 1: Find loginUser method**

**Step 2: Update loginUser to check isParent**

After storing token and user data (lines 313-317), add check:

```javascript
// Store token and user info
this.currentToken = data.token;
this.currentUser = data.user;
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));

// NEW: Check if user is parent and redirect accordingly
if (data.user.isParent) {
    this.showScreen('parentDashboard');
    this.initParentDashboard();
} else {
    this.showAuthenticatedScreens();
}
```

Remove or comment out the existing `this.showAuthenticatedScreens()` call on line 322.

**Step 3: Add initParentDashboard method stub**

Add method after showAuthenticatedScreens (around line 280):

```javascript
initParentDashboard() {
    console.log('Parent dashboard initialized');
    // React mounting will be added later
}
```

**Step 4: Verify syntax**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
node -c src/client/public/js/main.js
```

Expected: No syntax errors

**Step 5: Commit**

```bash
git add src/client/public/js/main.js
git commit -m "feat: redirect parent users to parent dashboard"
```

---

### Task 6: Update showAuthenticatedScreens to handle parent users

**Files:**
- Modify: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/public/js/main.js:277-280`

**Step 1: Find showAuthenticatedScreens method**

**Step 2: Update to check if user is parent**

```javascript
showAuthenticatedScreens() {
    if (this.currentUser?.isParent) {
        this.showScreen('parentDashboard');
        this.initParentDashboard();
    } else {
        this.showScreen('start');
        this.fetchAndUpdateMultipliers();
    }
}
```

**Step 3: Verify syntax**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
node -c src/client/public/js/main.js
```

Expected: No syntax errors

**Step 4: Commit**

```bash
git add src/client/public/js/main.js
git commit -m "feat: update showAuthenticatedScreens for parent users"
```

---

### Task 7: Create React mounting utility

**Files:**
- Create: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/public/js/react-mount.js`

**Step 1: Create file with React mounting utility**

```javascript
// React mounting utility for parent dashboard
let parentDashboardRoot = null;

export async function mountParentDashboard(containerId = 'parent-dashboard-container') {
    try {
        // Dynamically import React and ReactDOM
        const React = await import('react');
        const ReactDOM = await import('react-dom/client');

        // Import ParentDashboard component
        const module = await import('/src/client/components/ParentDashboard.tsx');
        const ParentDashboard = module.default;

        // Get container
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        // Clear container and create root
        container.innerHTML = '';
        parentDashboardRoot = ReactDOM.createRoot(container);

        // Render component
        parentDashboardRoot.render(React.createElement(ParentDashboard));

        console.log('ParentDashboard mounted successfully');
    } catch (error) {
        console.error('Failed to mount ParentDashboard:', error);
    }
}

export function unmountParentDashboard() {
    if (parentDashboardRoot) {
        parentDashboardRoot.unmount();
        parentDashboardRoot = null;
        console.log('ParentDashboard unmounted');
    }
}
```

**Step 2: Update initParentDashboard to use mounting utility**

Modify `initParentDashboard` method in main.js:

```javascript
initParentDashboard() {
    console.log('Initializing parent dashboard');
    import('./react-mount.js')
        .then(module => module.mountParentDashboard())
        .catch(error => console.error('Failed to load parent dashboard:', error));
}
```

**Step 3: Add cleanup to showScreen method**

Find showScreen method (line 195) and add before hiding all screens:

```javascript
showScreen(screenName) {
    // Clean up parent dashboard if leaving
    if (screenName !== 'parentDashboard' && this.currentScreen === 'parentDashboard') {
        import('./react-mount.js')
            .then(module => module.unmountParentDashboard())
            .catch(() => {});
    }

    // Store current screen
    this.currentScreen = screenName;

    // Rest of existing method...
}
```

Add `this.currentScreen = null;` to initGlobalVariables.

**Step 4: Verify syntax**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
node -c src/client/public/js/react-mount.js
node -c src/client/public/js/main.js
```

Expected: No syntax errors

**Step 5: Commit**

```bash
git add src/client/public/js/react-mount.js src/client/public/js/main.js
git commit -m "feat: add React mounting utility for parent dashboard"
```

---

### Task 8: Update ParentDashboard.tsx to fetch real user data

**Files:**
- Modify: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/components/ParentDashboard.tsx`

**Step 1: Replace mock data with API call**

Update useEffect to fetch real data:

```typescript
useEffect(() => {
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                setLoading(false);
                return;
            }

            const response = await fetch('/parent/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                setError('Authentication failed. Please login again.');
                setLoading(false);
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const users = await response.json();
            setUsers(users);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load user data');
            setLoading(false);
        }
    };

    fetchUsers();
}, []);
```

**Step 2: Update user data structure**

The API returns users with `id`, `username`, `earned_credits`, `claimed_credits`, `multipliers` fields. Update the table rendering to match.

**Step 3: Verify TypeScript compilation**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
npx tsc --noEmit src/client/components/ParentDashboard.tsx
```

Expected: No type errors (may need to install @types/react if missing)

**Step 4: Commit**

```bash
git add src/client/components/ParentDashboard.tsx
git commit -m "feat: update ParentDashboard to fetch real user data"
```

---

### Task 9: Implement multiplier editing in ParentDashboard

**Files:**
- Modify: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/components/ParentDashboard.tsx`

**Step 1: Add multiplier editing state**

Add state for editing:

```typescript
const [editingMultiplier, setEditingMultiplier] = useState<{userId: string, quizType: string, value: number} | null>(null);
const [updateLoading, setUpdateLoading] = useState(false);
```

**Step 2: Create updateMultiplier function**

```typescript
const updateMultiplier = async (userId: string, quizType: string, multiplier: number) => {
    setUpdateLoading(true);
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/parent/users/${userId}/multiplier`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizType, multiplier })
        });

        if (!response.ok) {
            throw new Error(`Update failed: ${response.status}`);
        }

        // Update local state
        setUsers(prevUsers => prevUsers.map(user => {
            if (user.id === userId) {
                return {
                    ...user,
                    multipliers: {
                        ...user.multipliers,
                        [quizType]: multiplier
                    }
                };
            }
            return user;
        }));

        setEditingMultiplier(null);
    } catch (err) {
        console.error('Error updating multiplier:', err);
        alert('Failed to update multiplier');
    } finally {
        setUpdateLoading(false);
    }
};
```

**Step 3: Update table to show editable multipliers**

Replace the multipliers cell with editable inputs for each quiz type.

**Step 4: Verify TypeScript compilation**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
npx tsc --noEmit src/client/components/ParentDashboard.tsx
```

Expected: No type errors

**Step 5: Commit**

```bash
git add src/client/components/ParentDashboard.tsx
git commit -m "feat: implement multiplier editing in ParentDashboard"
```

---

### Task 10: Add CSS styling for parent dashboard

**Files:**
- Modify: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/client/public/css/parent.css`

**Step 1: Check if parent.css exists**

If not, create it.

**Step 2: Add styles for parent dashboard**

Add styles for table, editable inputs, loading states.

**Step 3: Verify CSS syntax**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
npx css-validator src/client/public/css/parent.css 2>&1 | head -20
```

Or check by building.

**Step 4: Commit**

```bash
git add src/client/public/css/parent.css
git commit -m "feat: add CSS styling for parent dashboard"
```

---

### Task 11: Test the implementation

**Step 1: Start development server**

```bash
cd /home/richard/dev/quiz/.worktrees/feature/parent-dashboard
npm run dev
```

**Step 2: Test parent login**

1. Navigate to http://localhost:5173
2. Login with parent credentials (username: parent, password: admin2)
3. Verify redirect to parent dashboard
4. Verify user data loads
5. Test multiplier editing
6. Test navigation back to start screen
7. Test logout

**Step 3: Run existing tests**

```bash
npm test
```

Expected: All tests pass

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "test: verify parent dashboard functionality"
```

---

### Task 12: Create end-to-end test

**Files:**
- Create: `/home/richard/dev/quiz/.worktrees/feature/parent-dashboard/src/server/test/parent-dashboard.e2e.test.ts`

**Step 1: Create E2E test file**

Write test that:
1. Logs in as parent user
2. Verifies parent dashboard loads
3. Tests multiplier update functionality

**Step 2: Run E2E test**

```bash
npm run playwright
```

**Step 3: Commit test**

```bash
git add src/server/test/parent-dashboard.e2e.test.ts
git commit -m "test: add E2E test for parent dashboard"
```

---

Plan complete and saved to `docs/plans/2026-01-17-parent-dashboard-implementation.md`.

Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?