# Absolute Earned Credit Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify earned credit updates in Parent Dashboard to only allow setting absolute earned credit values, removing "Add" and "Subtract" operations.

**Architecture:** Frontend removes dropdown and type parameter, backend removes validation and type handling, API simplified to accept only absolute amounts.

**Tech Stack:** React TypeScript frontend, Node.js/Express backend, Jest tests

---

## Task 1: Frontend - Remove credit type dropdown and state

**Files:**
- Modify: `src/client/components/ParentDashboard.tsx:21` (creditType state)
- Modify: `src/client/components/ParentDashboard.tsx:240` (setCreditType reset)
- Modify: `src/client/components/ParentDashboard.tsx:253` (setCreditType initialization)
- Modify: `src/client/components/ParentDashboard.tsx:374-383` (dropdown UI)
- Modify: `src/client/components/ParentDashboard.tsx:225-228` (API request body)

**Step 1: Remove creditType state**

```typescript
// Line 21: Remove this line
const [creditType, setCreditType] = ReactInstance.useState<'add' | 'subtract' | 'set'>('add');
```

**Step 2: Run test to verify compilation fails**

Run: `npm run build 2>&1 | grep -A5 -B5 "creditType"`
Expected: Error about missing creditType variable

**Step 3: Remove setCreditType calls**

```typescript
// Line 240: Remove this line
setCreditType('add');

// Line 253: Remove this line
setCreditType('add');
```

**Step 4: Remove dropdown UI**

```typescript
// Lines 374-383: Replace with simple label
<span className="credit-label">Set Earned Credits:</span>
```

**Step 5: Remove type parameter from API request**

```typescript
// Lines 225-228: Remove type parameter
body: JSON.stringify({
  field,
  amount: amountValue
  // Remove: type: creditType
})
```

**Step 6: Run build to verify no errors**

Run: `npm run build`
Expected: Successful compilation

**Step 7: Commit**

```bash
git add src/client/components/ParentDashboard.tsx
git commit -m "feat: remove credit type dropdown and state from frontend"
```

---

## Task 2: Frontend - Update UI labels and validation

**Files:**
- Modify: `src/client/components/ParentDashboard.tsx:373` (credit label)
- Modify: `src/client/components/ParentDashboard.tsx:414` (button title)

**Step 1: Update credit edit label**

```typescript
// Line 373: Change from "Add Earned:" to "Set Earned Credits:"
<span className="credit-label">Set Earned Credits:</span>
```

**Step 2: Update button title**

```typescript
// Line 414: Change from "Add/Remove Earned Credits" to "Set Earned Credits"
title="Set Earned Credits"
```

**Step 3: Run tests to verify UI changes**

Run: `npm test src/server/test/parent-dashboard.e2e.test.ts 2>&1 | tail -20`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/client/components/ParentDashboard.tsx
git commit -m "feat: update UI labels for absolute credit setting"
```

---

## Task 3: Backend - Remove type parameter validation

**Files:**
- Modify: `src/server/parent/parent.controller.impl.ts:230-237` (type validation)
- Modify: `src/server/parent/parent.controller.impl.ts:206` (destructuring)
- Modify: `src/server/parent/parent.controller.impl.ts:294` (response type)

**Step 1: Remove type parameter from destructuring**

```typescript
// Line 206: Remove type from destructuring
const { field, amount, earnedCredits, claimedCredits, earnedDelta, claimedDelta } = req.body;
```

**Step 2: Remove type validation**

```typescript
// Lines 230-237: Remove entire type validation block
if (type !== undefined && type !== 'add' && type !== 'subtract' && type !== 'set') {
  return res.status(400).json({
    error: {
      message: 'Type must be either "add", "subtract", or "set"',
      code: 'INVALID_TYPE'
    }
  });
}
```

**Step 3: Remove type from response**

```typescript
// Line 294: Remove type from response
type  // Remove this line
```

**Step 4: Run tests to verify backend changes**

Run: `npm test src/server/test/parent-dashboard.e2e.test.ts -- --testNamePattern="should update user credits" 2>&1 | tail -10`
Expected: Tests pass

**Step 5: Commit**

```bash
git add src/server/parent/parent.controller.impl.ts
git commit -m "feat: remove type parameter from backend API"
```

---

## Task 4: Backend - Simplify credit calculation logic

**Files:**
- Modify: `src/server/parent/parent.controller.impl.ts:251-259` (type-based calculation)
- Modify: `src/server/parent/parent.controller.impl.ts:253-259` (remove conditional logic)

**Step 1: Remove type-based calculation**

```typescript
// Lines 251-259: Replace with simple absolute value
let targetAmount = amount;
// Remove lines 253-259:
// if (type === 'set') {
//   targetAmount = amount;
// } else if (type === 'add') {
//   targetAmount = currentEarned + amount;
// } else if (type === 'subtract') {
//   targetAmount = currentEarned - amount;
// }
```

**Step 2: Ensure non-negative amount**

```typescript
// Line 261: Keep this line (ensures amount is non-negative)
targetAmount = Math.max(0, targetAmount);
```

**Step 3: Run tests to verify calculation logic**

Run: `npm test src/server/test/parent-dashboard.e2e.test.ts -- --testNamePattern="credits" 2>&1 | grep -A2 -B2 "PASS\|FAIL"`
Expected: All credit-related tests pass

**Step 4: Commit**

```bash
git add src/server/parent/parent.controller.impl.ts
git commit -m "feat: simplify credit calculation to absolute values only"
```

---

## Task 5: Backend - Remove earned credit validation

**Files:**
- Modify: `src/server/parent/parent.controller.impl.ts:264-271` (earned credit validation)

**Step 1: Remove earned credit validation**

```typescript
// Lines 264-271: Remove entire validation block
if (targetAmount < currentEarned) {
  return res.status(409).json({
    error: {
      message: 'Cannot set earned credits below current earned credits',
      code: 'INVALID_AMOUNT'
    }
  });
}
```

**Step 2: Run specific test for validation removal**

Run: `npm test src/server/test/parent-dashboard.e2e.test.ts -- --testNamePattern="should reject claimed credits exceeding earned credits" 2>&1 | tail -5`
Expected: Test still passes (this is for claimed credits, not earned)

**Step 3: Create test for absolute earned credit setting**

Create: `src/server/test/absolute-earned-credits.test.ts`

```typescript
import request from 'supertest';
import { app } from '../index';

describe('Absolute Earned Credit Updates', () => {
  it('should allow setting earned credits to any non-negative value', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'parent:admin2', password: 'admin2' });

    const token = loginRes.body.token;

    // First get a user
    const usersRes = await request(app)
      .get('/parent/users')
      .set('Authorization', `Bearer ${token}`);

    const userId = usersRes.body.users[0].id;
    const currentEarned = usersRes.body.users[0].earnedCredits || 0;

    // Test setting to higher value
    const higherRes = await request(app)
      .patch(`/parent/users/${userId}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'earned', amount: currentEarned + 100 });

    expect(higherRes.status).toBe(200);
    expect(higherRes.body.earnedCredits).toBe(currentEarned + 100);

    // Test setting to lower value (should now be allowed)
    const lowerRes = await request(app)
      .patch(`/parent/users/${userId}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'earned', amount: currentEarned - 50 });

    expect(lowerRes.status).toBe(200);
    expect(lowerRes.body.earnedCredits).toBe(currentEarned - 50);

    // Test setting to zero
    const zeroRes = await request(app)
      .patch(`/parent/users/${userId}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'earned', amount: 0 });

    expect(zeroRes.status).toBe(200);
    expect(zeroRes.body.earnedCredits).toBe(0);
  });
});
```

**Step 4: Run new test**

Run: `npm test src/server/test/absolute-earned-credits.test.ts 2>&1 | tail -10`
Expected: Test passes

**Step 5: Commit**

```bash
git add src/server/parent/parent.controller.impl.ts src/server/test/absolute-earned-credits.test.ts
git commit -m "feat: remove earned credit validation and add test for absolute setting"
```

---

## Task 6: Update existing tests

**Files:**
- Modify: `src/server/test/parent-dashboard.e2e.test.ts` (credit update tests)
- Search for: Tests using "add" or "subtract" type

**Step 1: Find and update credit update tests**

Run: `grep -n "type.*['\"]add['\"]\|type.*['\"]subtract['\"]" src/server/test/parent-dashboard.e2e.test.ts`
Expected: Find tests using add/subtract

**Step 2: Update test "should update user credits with absolute values"**

```typescript
// Find the test and update request body
// Change from: .send({ field: 'earned', amount: 100, type: 'set' })
// To: .send({ field: 'earned', amount: 100 })
```

**Step 3: Update test "should update user credits with delta values"**

```typescript
// This test should be removed or modified since delta operations are no longer supported
// Either remove the test or change it to test absolute values
```

**Step 4: Run updated tests**

Run: `npm test src/server/test/parent-dashboard.e2e.test.ts 2>&1 | tail -20`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/server/test/parent-dashboard.e2e.test.ts
git commit -m "test: update tests for absolute credit updates"
```

---

## Task 7: End-to-end verification

**Files:**
- Test: Manual verification of UI
- Test: API endpoint verification

**Step 1: Start development server**

Run: `npm run dev 2>&1 &`
Expected: Server starts on port 3000

**Step 2: Verify UI changes**

1. Open browser to http://localhost:3000
2. Login with parent credentials
3. Navigate to Parent Dashboard
4. Click "Earned Credits" button on any user
5. Verify: No dropdown, only number input with "Set Earned Credits:" label

**Step 3: Test API endpoint with curl**

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"parent:admin2","password":"admin2"}' | jq -r '.token')

# Get user ID
USER_ID=$(curl -s http://localhost:3000/parent/users \
  -H "Authorization: Bearer $TOKEN" | jq -r '.users[0].id')

# Test absolute setting
curl -X PATCH http://localhost:3000/parent/users/$USER_ID/credits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field":"earned","amount":500}'

# Expected: {"message":"Credits updated successfully",...}
```

**Step 4: Run all tests**

Run: `npm test 2>&1 | tail -5`
Expected: "Test Suites: 9 passed, 9 total" (including new test)

**Step 5: Commit final verification**

```bash
git add .  # Add any remaining changes
git commit -m "chore: final verification of absolute earned credit updates"
```

---

## Task 8: Cleanup and documentation

**Files:**
- Update: `docs/plans/2026-01-22-absolute-earned-credit-update-design.md` (add implementation notes)
- Check: API documentation if any exists

**Step 1: Update design document with implementation notes**

Add to end of design document:
```markdown
## Implementation Notes

Completed on 2026-01-22 with the following changes:

1. **Frontend**: Removed credit type dropdown, simplified to absolute value input
2. **Backend**: Removed type parameter and validation, simplified to absolute values only
3. **API**: Updated to accept only `{ field, amount }` without `type` parameter
4. **Tests**: Updated existing tests and added new test for absolute value setting
```

**Step 2: Check for API documentation**

Run: `find . -name "*.md" -type f -exec grep -l "credits.*type.*add.*subtract" {} \; 2>/dev/null`
Expected: May find API documentation files

**Step 3: Update any found documentation**

If documentation files found, update references to credit update API.

**Step 4: Final commit**

```bash
git add docs/
git commit -m "docs: update documentation for absolute earned credit updates"
```

---

**Plan complete and saved to `docs/plans/2026-01-22-absolute-earned-credit-update-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**