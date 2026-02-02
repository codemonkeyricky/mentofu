# Credit Claiming Race Condition Fix

**Date:** 2026-02-01
**Status:** Planned
**Priority:** High
**Author:** Claude Sonnet 4.5
**Related Issues:** Race condition in credit claiming logic

## Overview

This plan addresses a critical race condition in the credit claiming system where users can over-claim credits despite having a `claim <= earned` check. The issue occurs due to a non-atomic read-validate-update pattern that fails under concurrent requests.

## Problem Statement

Users can over-claim credits despite the system having a `claim <= earned` validation check. When multiple concurrent credit claim requests occur, each can pass validation individually but collectively exceed the limit.

## Root Cause Analysis

The `CreditService.addClaimedCredits()` method follows a non-atomic read-validate-update pattern:
1. Reads `totalEarned` and `currentClaimed` separately
2. Validates `currentClaimed + amount <= totalEarned`
3. Updates `claimed_credits` if validation passes

When multiple concurrent requests occur:
- Request A reads current claimed (e.g., 50) and earned (e.g., 100)
- Request B reads same values before either updates
- Both pass validation for claims of 30 each
- Both update, resulting in total claimed of 110 (> 100 earned)

## Critical Files

1. `/home/richard/dev/quiz/src/server/credit/credit.service.ts` - Main credit service with validation (lines 37-50)
2. `/home/richard/dev/quiz/src/server/parent/parent.service.ts` - Parent service with similar issue (lines 94-104)
3. `/home/richard/dev/quiz/src/server/database/postgres/postgres.database.ts` - PostgreSQL implementation
4. `/home/richard/dev/quiz/src/server/database/interface/database.service.ts` - Database service layer
5. `/home/richard/dev/quiz/src/server/database/interface/database.interface.ts` - Database operations interface

## Solution Design

Implement atomic credit claiming with database-level integrity for PostgreSQL and transaction-based integrity for memory database. Based on requirements:
- Support both PostgreSQL and memory database modes
- Fix violating data automatically during migration
- Include retry logic with exponential backoff for concurrent claims

### Phase 1: Database Layer Updates

#### 1.1 Update Database Interface
**File:** `/home/richard/dev/quiz/src/server/database/interface/database.interface.ts`
Add new atomic method:
```typescript
addClaimedCreditsAtomic(userId: string, amount: number, maxTotalEarned: number): Promise<boolean>
```
Returns `true` if successful, `false` if validation fails.

#### 1.2 PostgreSQL Implementation
**File:** `/home/richard/dev/quiz/src/server/database/postgres/postgres.database.ts`
- Add CHECK constraint during table creation: `CHECK (claimed_credits <= earned_credits)`
- Implement atomic UPDATE:
```sql
UPDATE users
SET claimed_credits = claimed_credits + ${amount}
WHERE id = ${userId}
  AND claimed_credits + ${amount} <= earned_credits
```
- Return `true` if rowCount > 0, `false` otherwise

#### 1.3 Memory Database Implementation
**File:** `/home/richard/dev/quiz/src/server/database/interface/database.service.ts`
- Use `executeInTransaction()` for atomicity
- Validate `currentClaimed + amount <= maxTotalEarned` within transaction
- Update if validation passes
- Return boolean success indicator

#### 1.4 Database Service Routing
**File:** `/home/richard/dev/quiz/src/server/database/interface/database.service.ts`
- Add `addClaimedCreditsAtomic()` method that works for both modes:
  ```typescript
  async addClaimedCreditsAtomic(userId: string, amount: number, maxTotalEarned: number): Promise<boolean> {
    if (this.memoryDatabase) {
      // Memory database implementation using executeInTransaction
      return await this.memoryDatabase.executeInTransaction(async () => {
        const user = this.memoryDatabase.users.get(userId);
        if (!user) return false;

        const currentClaimed = user.claimed_credits || 0;
        if (currentClaimed + amount > maxTotalEarned) {
          return false;
        }

        user.claimed_credits = currentClaimed + amount;
        return true;
      });
    } else if (this.postgresDatabase) {
      // PostgreSQL implementation
      return await this.postgresDatabase.addClaimedCreditsAtomic(userId, amount, maxTotalEarned);
    }
    throw new Error('No database configured');
  }
  ```
- Route to appropriate database implementation
- Handle both memory and PostgreSQL modes transparently

### Phase 2: Service Layer Updates

#### 2.1 Credit Service Update
**File:** `/home/richard/dev/quiz/src/server/credit/credit.service.ts`
Replace current `addClaimedCredits()` implementation with atomic version including retry logic:

```typescript
async addClaimedCredits(userId: string, amount: number): Promise<void> {
  if (!this.databaseService) {
    throw new Error('Database service not initialized');
  }

  // Validate amount is positive
  if (amount <= 0) {
    throw new Error('Claim amount must be positive');
  }

  let totalEarned = await this.getTotalEarned(userId);
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Try atomic update
    const success = await this.databaseService.addClaimedCreditsAtomic(
      userId,
      amount,
      totalEarned
    );

    if (success) {
      return; // Success!
    }

    // Atomic update failed - check if earned credits changed
    if (attempt < maxRetries - 1) {
      const newTotalEarned = await this.getTotalEarned(userId);
      if (newTotalEarned !== totalEarned) {
        // Earned credits changed, update and retry immediately
        totalEarned = newTotalEarned;
        continue;
      }
    }

    // Wait with exponential backoff before retry
    if (attempt < maxRetries - 1) {
      const delayMs = 50 * Math.pow(2, attempt); // 50ms, 100ms, 200ms
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // All retries failed
  throw new Error('Total claimed credit cannot be larger than total earned credit');
}
```

#### 2.2 Parent Service Update
**File:** `/home/richard/dev/quiz/src/server/parent/parent.service.ts`
Update credit update logic (lines 100-104):
- Use atomic operations for claimed credit updates
- Handle validation failures with appropriate error messages
- Maintain backward compatibility for API

### Phase 3: Database Migration (PostgreSQL Only)

#### 3.1 Migration Script
Create migration script to add CHECK constraint:
```sql
ALTER TABLE users ADD CONSTRAINT check_claimed_le_earned
CHECK (claimed_credits <= earned_credits);
```

#### 3.2 Safe Migration Strategy
1. Backup existing data
2. Fix violating rows automatically: `UPDATE users SET claimed_credits = earned_credits WHERE claimed_credits > earned_credits`
3. Validate all rows satisfy constraint before applying
4. Apply constraint with validation
5. Test thoroughly after migration

### Phase 4: Testing

#### 4.1 Unit Tests
**File:** `/home/richard/dev/quiz/src/server/test/credit.service.test.ts`
- Update existing tests to use atomic method
- Add tests for concurrent claims
- Test retry logic
- Test both success and failure cases

#### 4.2 Integration Tests
Create new test file for concurrent scenarios:
- Simulate multiple simultaneous claims
- Test race condition prevention
- Verify atomicity guarantees

#### 4.3 Edge Case Tests
- Zero credits
- Negative amounts (should be prevented)
- Large claim amounts
- Concurrent earned credit changes

## Implementation Order
1. Database interface and implementations
2. Credit service update
3. Parent service update
4. Tests
5. Database migration (if using PostgreSQL)

## Verification Strategy

### 1. Manual Testing
- Test credit claiming through UI
- Verify validation works
- Test concurrent claims using multiple browser tabs/API calls

### 2. Automated Testing
- Run existing test suite
- Add new concurrency tests
- Test both database modes (memory and PostgreSQL)

### 3. Database Integrity Check
- Verify CHECK constraint exists (PostgreSQL)
- Test constraint enforcement
- Verify no rows violate constraint

## Risks and Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation:** Maintain backward compatibility in API, update implementation only

### Risk 2: Performance Impact
**Mitigation:** Atomic operations are efficient, retry logic has exponential backoff

### Risk 3: Database Migration Issues
**Mitigation:** Backup first, validate constraint before applying, test thoroughly

### Risk 4: Memory Database Transaction Issues
**Mitigation:** Use existing `executeInTransaction()` mechanism, test concurrent scenarios

## Success Criteria
1. No race conditions in credit claiming
2. `claimed_credits <= earned_credits` always maintained
3. Existing tests pass
4. New concurrency tests pass
5. Both database modes work correctly
6. Backward compatibility maintained

## References
- Existing plan files in `/docs/plans/`
- PostgreSQL documentation for CHECK constraints
- Database service interface patterns in codebase

---

*This plan is ready for implementation. Follow the phased approach to ensure system stability and backward compatibility.*