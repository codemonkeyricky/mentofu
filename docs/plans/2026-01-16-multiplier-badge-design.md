# Multiplier Badge Design

## Overview
Add a multiplier badge to quiz cards showing the multiplier (e.g., x1, x2, x3) that applies to quiz scores. If a user scores 3 points with a multiplier of 3, they earn 9 credits.

## Requirements
- Badge shows multiplier value as rounded integer (x1, x2, x3)
- Badge positioned in top-right corner of quiz card
- Circular badge design with gradient colors based on multiplier value
- Multipliers fetched from existing backend API `/session/multiplier/:quizType`
- Quiz types map to multiplier categories: math quizzes → 'math', spelling → 'simple_words'

## Architecture

### Frontend Changes
1. **HTML**: Add `<div class="multiplier-badge" data-multiplier="1">x1</div>` inside each quiz card
2. **CSS**: Circular badge styling with position absolute, gradient colors, shadow
3. **JavaScript**: Fetch multipliers on page load, update badges with rounded values

### Backend Integration
- Use existing endpoint: `GET /session/multiplier/:quizType`
- No backend modifications needed
- Multipliers already stored per user per quiz category

### Data Flow
1. User authenticates → fetch multipliers for 'math' and 'simple_words' categories
2. Map each quiz card to appropriate category
3. Round multiplier to nearest integer (1.0 → 1, 2.5 → 3, etc.)
4. Update badge text and color based on value
5. Apply badge styling with color gradient

## Component Design

### HTML Structure
```html
<div class="quiz-card" data-quiz-type="simple-math">
    <div class="quiz-icon">
        <i class="fas fa-times"></i>
    </div>
    <div class="quiz-info">
        <h4>Multiplication</h4>
        <p>Practice multiplication</p>
    </div>
    <div class="multiplier-badge" data-multiplier="1">x1</div>
    <button class="btn btn-outline start-quiz-btn">Start</button>
</div>
```

### CSS Styling
- Position: absolute, top-right corner (-8px offsets)
- Size: 32px diameter circular badge
- Colors: Gradient based on multiplier value:
  - x1: Blue (`#3498db` to `#2980b9`)
  - x2: Green (`#2ecc71` to `#27ae60`)
  - x3: Orange (`#f39c12` to `#e67e22`)
  - x4: Red (`#e74c3c` to `#c0392b`)
  - x5+: Purple (`#9b59b6` to `#8e44ad`)
- Text: White, centered, bold, 14px
- Shadow: Subtle drop shadow for depth

### JavaScript Logic
```javascript
// Fetch multipliers for both categories
async fetchAndUpdateMultipliers() {
    try {
        const mathMultiplier = await fetchMultiplier('math');
        const wordsMultiplier = await fetchMultiplier('simple_words');
        updateQuizCardBadges(mathMultiplier, wordsMultiplier);
    } catch (error) {
        console.error('Failed to fetch multipliers:', error);
        setAllBadgesToDefault();
    }
}

// Round multiplier to nearest integer
function roundMultiplier(value) {
    return Math.round(value);
}

// Update badge text and color
function updateBadge(badgeElement, multiplier) {
    const rounded = roundMultiplier(multiplier);
    badgeElement.textContent = `x${rounded}`;
    badgeElement.setAttribute('data-multiplier', rounded);
}
```

## Quiz Type Mapping
| Quiz Type | Multiplier Category |
|-----------|---------------------|
| simple-math | math |
| simple-math-2 | math |
| simple-math-3 | math |
| simple-math-4 | math |
| simple-math-5 | math |
| simple-words | simple_words |

## Error Handling
- Default to x1 if API fetch fails
- Fallback to neutral blue color on errors
- Log errors to console for debugging

## Testing Considerations
1. Verify badge appears on all quiz cards
2. Test color changes with different multiplier values
3. Verify API integration works with authenticated users
4. Test rounding logic with decimal values
5. Verify badge doesn't interfere with existing quiz card functionality

## File Changes
1. `src/client/index.html` - Add badge elements to quiz cards
2. `src/client/public/css/style.css` - Add multiplier badge styles
3. `src/client/public/js/main.js` - Add multiplier fetching and badge updating logic

## Dependencies
- Existing authentication system (multiplier API requires auth)
- Existing `/session/multiplier/:quizType` endpoint
- Existing quiz card structure and styling

## Success Criteria
1. Multiplier badge displays correctly on all quiz cards
2. Badge shows correct rounded multiplier value
3. Color changes appropriately with multiplier value
4. Badge updates when multipliers change
5. No impact on existing quiz functionality