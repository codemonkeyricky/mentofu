# Absolute Earned Credit Update Design

## Overview
Simplify the earned credit update functionality in the Parent Dashboard to only allow setting absolute earned credit values, removing the "Add" and "Subtract" operations.

## Current State Analysis
The current system allows three operations for updating earned credits:
1. **Add**: Increment current earned credits
2. **Subtract**: Decrement current earned credits (with validation preventing going below current)
3. **Set**: Set to absolute value (with validation preventing going below current)

The user wants to simplify this to **only allow setting absolute earned credit values**.

## Design Decisions
Based on user feedback:
1. **UI Approach**: Remove "Add" and "Subtract" options completely from dropdown
2. **Backend Validation**: Remove validation that prevents setting earned credits below current earned credits
3. **API Simplification**: Remove 'type' parameter entirely, always treat updates as absolute values

## Changes Required

### Frontend Changes (1 file)

**1. ParentDashboard Component**
- **File**: `src/client/components/ParentDashboard.tsx`
  - Remove `<select>` element with "Add", "Subtract", and "Set" options (lines 374-383)
  - Replace with simple number input for absolute value
  - Update button label from "Add Earned:" to "Set Earned Credits:"
  - Remove `creditType` state (line 21) and all `setCreditType` calls
  - Update `startEditingCredits` function to not set `creditType`
  - Remove `type` parameter from API request body in `updateCredits` function
  - Always send absolute amount value to API

### Backend Changes (1 file)

**2. Parent Controller**
- **File**: `src/server/parent/parent.controller.impl.ts`
  - Remove validation that prevents setting earned credits below current (lines 264-271)
  - Always allow setting any non-negative absolute value
  - Keep the `Math.max(0, targetAmount)` check (line 261)
  - Remove `type` parameter validation (lines 230-237)
  - Always treat `amount` as absolute target value
  - Update response to reflect absolute setting

### API Contract Changes

**Current request:**
```json
{
  "field": "earned",
  "amount": 100,
  "type": "set"  // or "add", "subtract"
}
```

**New request:**
```json
{
  "field": "earned",
  "amount": 100  // always absolute value
}
```

### Testing Considerations
- Update any tests that use "add" or "subtract" operations
- Ensure tests validate absolute value setting works correctly
- Remove tests for the removed validation logic

## Implementation Details

**Frontend UI Pattern:**
```jsx
{editingCredits?.userId === user.id && editingCredits?.field === 'earned' ? (
  <div className="credit-edit">
    <div className="credit-edit-row">
      <span className="credit-label">Set Earned Credits:</span>
      <input
        type="number"
        min="0"
        step="1"
        value={creditAmount}
        onChange={(e) => setCreditAmount(e.target.value)}
        disabled={updateLoading}
        className="credit-amount-input"
      />
      <button
        onClick={() => updateCredits(user.id, 'earned', parseInt(creditAmount) || 0)}
        disabled={updateLoading || parseInt(creditAmount) <= 0}
        className="btn btn-sm btn-success"
      >
        {updateLoading ? 'Saving...' : 'Save'}
      </button>
      <button
        onClick={cancelEditingCredits}
        disabled={updateLoading}
        className="btn btn-sm btn-outline"
      >
        Cancel
      </button>
    </div>
  </div>
) : (
  // Existing button remains
)}
```

**Backend Update Pattern:**
```typescript
// Remove type parameter logic, always treat amount as absolute
let targetAmount = amount;
targetAmount = Math.max(0, targetAmount);

if (field === 'earned') {
  // Remove validation: if (targetAmount < currentEarned) { ... }
  await this.databaseService.addEarnedCredits(user.id, targetAmount - currentEarned);
}
```

## Testing Strategy
- Test absolute value setting with various amounts (positive, zero)
- Verify validation removal allows setting lower values
- Test error handling for invalid amounts
- Verify UI only shows absolute value input

## Implementation Order
1. Frontend simplification - Remove dropdown and related state
2. Backend simplification - Remove type parameter and validation
3. Update tests - Adjust test cases for new behavior
4. Documentation - Update API documentation if needed

This design follows existing patterns in the codebase and implements the absolute earned credit update functionality as requested.