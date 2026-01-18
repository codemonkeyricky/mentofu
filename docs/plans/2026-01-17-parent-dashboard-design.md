# Parent Dashboard Design
**Date**: 2026-01-17
**Status**: Validated with user
**Author**: Claude Code

## Overview
When users log in with `isParent: true`, redirect them to a parent dashboard where they can view and edit quiz multipliers for students.

## Current State Analysis
- Backend already has full parent API endpoints (`GET /parent/users`, `PATCH /parent/users/:userId/multiplier`)
- Authentication returns `isParent` flag in login response
- Vanilla JS parent module exists but not integrated with main app
- React `ParentDashboard.tsx` component exists but uses mock data
- Existing screen switching system in vanilla JS main app

## Design Decisions
1. **Dashboard Technology**: Use React `ParentDashboard.tsx` component (not vanilla JS module)
2. **Routing Approach**: Hybrid - use existing screen switching but render React component in a container
3. **Login Redirect**: Modify main.js login handler to check `isParent` flag and switch screens
4. **API Integration**: Connect to real APIs (not mock data)
5. **UI Design**: Simple table with inline multiplier editing

## Architecture

### Login Flow Modification
```javascript
// In main.js login handler (lines 293-333)
if (response.user.isParent) {
  localStorage.setItem('token', response.token);
  showScreen('parent-dashboard');
} else {
  // Existing regular user flow
}
```

### Screen System Extension
1. Add new screen ID `parent-dashboard` to existing screen system
2. Update `showScreen()` function to handle this screen
3. Create container div in `index.html` with ID `parent-dashboard-container`
4. Mount React `ParentDashboard` component in this container

### React Component Updates
Update `ParentDashboard.tsx` to:
- Remove mock data and fetch real users via `GET /parent/users` API
- Include JWT token from localStorage in API requests
- Implement multiplier editing with `PATCH /parent/users/:userId/multiplier` calls
- Show loading states and error handling

### API Connectivity Pattern
```javascript
const fetchUsers = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/parent/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (response.status === 401) {
    window.location.href = '/login';
    return;
  }
  return await response.json();
};
```

## Data Flow
1. **Login → Token Storage**: Parent logs in, JWT token stored in localStorage
2. **Screen Switch**: Main app switches to `parent-dashboard` screen
3. **React Mount**: `ParentDashboard` component mounts in container
4. **API Fetch**: Component fetches user list with multipliers via `GET /parent/users`
5. **Render Table**: Displays users and multipliers in editable table
6. **Update Flow**: User edits multiplier → optimistic UI update → API call → success/error feedback
7. **Logout**: Clear token and return to login screen

## Error Handling Strategy

### API Errors
- **401 Unauthorized**: Redirect to login screen
- **403 Forbidden**: Show "parent access required" message
- **400 Bad Request**: Show validation error from server
- **Network errors**: Retry logic with exponential backoff

### UI Error States
- Loading spinner during initial fetch
- Per-row loading states during updates
- Toast notifications for success/error messages
- Disable inputs during API calls to prevent race conditions

### React Error Boundary
- Wrap `ParentDashboard` component with error boundary
- Fallback UI showing "Dashboard failed to load" with retry button

## UI Design

### Multiplier Editing Table
Simple table showing:
- User ID, username, earned credits
- Columns for each quiz type (`simple-math`, `simple-math-2`, etc.) with editable multiplier inputs
- Save button per row or per cell with immediate API updates
- Visual feedback for successful/unsuccessful updates

### Styling Requirements
- Match existing app styling
- Responsive table design
- Clear labels and instructions for parents
- Consistent spacing and typography

## Key Files to Modify

### Primary Files
1. `src/client/public/js/main.js` - Login flow and screen switching
2. `src/client/components/ParentDashboard.tsx` - Connect to APIs, implement editing
3. `src/client/public/index.html` - Add container for React parent dashboard
4. CSS files for parent dashboard styling

### Supporting Files
1. `src/client/pages/parent.tsx` - Parent page wrapper (may need updates)
2. `src/client/components/ParentUserDetail.tsx` - Potential future enhancement

## Success Criteria
1. Parent users automatically redirected to dashboard on login
2. Real user data displayed with current multipliers
3. Multiplier updates persist via API
4. Error handling for authentication failures
5. Responsive, user-friendly interface

## Technical Notes
- Use `fetch` with Authorization header for API calls
- Store JWT token in localStorage (consistent with existing pattern)
- Implement optimistic updates for better UX
- Add error boundaries for React component failures
- Ensure compatibility with existing vanilla JS screen system