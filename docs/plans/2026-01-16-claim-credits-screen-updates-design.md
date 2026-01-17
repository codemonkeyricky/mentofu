# Claim Credits Screen Updates Design

**Date**: 2026-01-16
**Status**: Validated Design
**Author**: Claude Code

## Overview

Update the "Claim Credits" screen to:
1. Display specific quiz types (e.g., "Multiplication Quiz", "Division Quiz") instead of generic "Math Quiz"
2. Improve visual spacing and layout of report cards

## Current State Analysis

### Problem 1: Generic Quiz Type Display
- Backend stores session scores with `sessionType` as either 'math' (for all math quizzes) or 'simple_words'
- Frontend shows "Math Quiz" for all math quizzes regardless of actual type
- No distinction between Multiplication, Division, Fractions, BODMAS, Factors quizzes

### Problem 2: Report Card Layout
- Current CSS: `gap: 15px` and `padding: 8px 12px`
- Minimal vertical spacing between cards
- Could benefit from improved typography and visual hierarchy

## Solution Architecture

### Backend Changes

**Goal**: Store and return actual quiz types instead of generic categories

**Changes Required**:

1. **Database Interface** (`src/server/database/database.service.ts`):
   - Change `sessionType` type from `'math' | 'simple_words'` to `string` in `DatabaseOperations` interface
   - Update `saveSessionScore` method signature to accept string `sessionType`

2. **Session Service** (`src/server/session/session.service.ts`):
   - Update all `saveSessionScore` calls to pass the actual `quizType` parameter instead of hardcoded 'math'/'simple_words'
   - Locations: lines 165, 231, 279, 320, 386 in validation methods

3. **Multiplier Compatibility**:
   - Add mapping function to convert specific quiz types to multiplier categories:
     ```typescript
     private getMultiplierCategory(quizType: string): string {
       if (quizType === 'simple-words') return 'simple_words';
       if (quizType.startsWith('simple-math')) return 'math';
       return quizType;
     }
     ```
   - Update `getUserMultiplier` calls to use this mapping

### Frontend Changes

**Goal**: Display specific quiz names and improve report card styling

**Changes Required**:

1. **Quiz Type Mapping** (`src/client/public/js/main.js`):
   - Add quiz type to display name mapping:
     ```javascript
     const quizTypeDisplayNames = {
       'simple-math': 'Multiplication Quiz',
       'simple-math-2': 'Division Quiz',
       'simple-math-3': 'Fraction Comparison Quiz',
       'simple-math-4': 'BODMAS Quiz',
       'simple-math-5': 'Factors Quiz',
       'simple-words': 'Simple Words Quiz'
     };
     ```
   - Update `displaySessionReports()` function to use mapping

2. **CSS Improvements** (`src/client/public/css/style.css`):
   - Increase vertical spacing: `margin-bottom: 12px` on `.report-item`
   - Improve internal spacing: `gap: 20px`
   - Enhance typography: Increase `h5` font size to `1.1rem`
   - Add better visual hierarchy and padding

## Data Flow

### Before:
1. User takes quiz (e.g., `simple-math-2` - Division Quiz)
2. Backend validates and saves with `sessionType: 'math'`
3. Frontend fetches reports, sees `sessionType: 'math'`
4. Frontend displays "Math Quiz"

### After:
1. User takes quiz (e.g., `simple-math-2` - Division Quiz)
2. Backend validates and saves with `sessionType: 'simple-math-2'`
3. Frontend fetches reports, sees `sessionType: 'simple-math-2'`
4. Frontend maps to "Division Quiz" and displays it

## Multiplier System Compatibility

**Issue**: Multiplier system stores/looks up using 'math'/'simple_words' categories

**Solution**:
- Keep multiplier API unchanged (still accepts 'math'/'simple_words')
- Add internal mapping in backend for multiplier lookups
- When saving session score: store specific quiz type
- When getting multiplier: map to category ('math'/'simple_words')

## Testing Considerations

### Backend Tests:
1. Verify specific quiz types are stored in session scores
2. Ensure multiplier calculations work with mapping function
3. Test backward compatibility with existing 'math'/'simple_words' data

### Frontend Tests:
1. Verify quiz type mapping displays correct names
2. Test CSS improvements render correctly
3. Ensure responsive design remains intact

### Integration Tests:
1. End-to-end flow: quiz → save → display with correct type
2. Multiplier calculations with new session types

## Migration Strategy

**No data migration needed**:
- Existing session scores remain with 'math'/'simple_words'
- New sessions will have specific quiz types
- Frontend handles mixed data gracefully (shows "Math Quiz" for old records)

## Files to Modify

### Backend:
1. `src/server/database/database.service.ts` - Interface and implementation
2. `src/server/session/session.service.ts` - Validation methods and multiplier mapping

### Frontend:
1. `src/client/public/js/main.js` - Quiz type mapping and display logic
2. `src/client/public/css/style.css` - Report card styling improvements

## Risks and Mitigation

1. **Multiplier system breakage** - Mitigation: Internal mapping function
2. **Existing data display** - Mitigation: Frontend handles 'math'/'simple_words' as fallback
3. **CSS regression** - Mitigation: Test responsive design and existing layouts
4. **API compatibility** - Mitigation: Keep multiplier API unchanged

## Success Criteria

1. Claim Credits screen shows specific quiz names (e.g., "Division Quiz")
2. Report cards have improved vertical spacing and layout
3. Multiplier system continues to work correctly
4. Existing functionality remains unchanged
5. Responsive design maintained