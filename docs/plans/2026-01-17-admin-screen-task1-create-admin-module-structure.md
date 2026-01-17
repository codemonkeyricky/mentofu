# Admin Screen UI Implementation - Task 1: Create Admin Module Structure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create Admin Module Structure

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

**Note:** This is Task 1 of 8 from the comprehensive admin screen implementation plan. For the full plan, see `docs/plans/2026-01-17-admin-screen-implementation.md`.