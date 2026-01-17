# Admin Screen Design

## Overview
Create a web-based admin interface as a modal overlay within the existing quiz application, allowing administrators to adjust user earned/claimed credits and quiz multipliers. The interface will use the existing admin API endpoints and provide a distinct visual style separate from the main quiz UI.

## Requirements
From user brainstorming session:
- Separate admin login screen for admin authentication
- Admin interface as modal overlay on main quiz interface
- Distinct admin visual style (darker theme)
- User list with pagination for user selection
- Both credit and multiplier management capabilities
- Integration with existing admin API endpoints

## Architecture

### Authentication Flow
1. **Admin Login Modal**: Separate authentication screen accessible via hidden URL or admin link
2. **JWT Token Management**: Admin credentials validated against existing `isAdmin` flag in user database
3. **Session Storage**: Admin JWT token stored in sessionStorage for API access
4. **Token Expiry Handling**: Automatic redirect to admin login on 401 responses

### Frontend Integration
1. **Modal Overlay Approach**: Admin interface loads as modal overlay on top of main quiz interface
2. **Background Integration**: Uses existing Three.js canvas as background (dimmed during admin mode)
3. **Style Isolation**: Admin modal has distinct visual styling (darker theme) to differentiate from main UI
4. **API Integration**: All admin API calls use existing `/admin` endpoints with admin JWT tokens

### Core Components
1. **Admin Login Modal** - Separate authentication for admin users
2. **User Management Modal** - Main admin interface with paginated user list
3. **User Detail Modal** - Detailed view for credit/multiplier adjustments
4. **Confirmation Dialogs** - For destructive actions and changes

## User Interface Components

### Admin Login Modal
- Simple form with username/password fields
- "Admin Login" header with distinct styling (darker theme)
- Error messages for invalid credentials
- Successfully authenticated admins receive JWT token stored in sessionStorage

### User Management Modal (Primary Interface)
- Paginated user list displaying: username, earned credits, claimed credits, creation date
- Search bar for filtering users by username
- "Adjust Credits" and "Adjust Multipliers" action buttons per user
- Clear visual separation between admin interface and background quiz app

### User Detail Modal - Credit Management
- Display current earned/claimed credits for selected user
- Two adjustment modes:
  1. **Set Absolute Values**: Direct input fields for earned/claimed credits
  2. **Add/Subtract Amount**: Increment/decrement controls with amount input
- Visual warning if claimed credits would exceed earned credits
- Real-time validation and confirmation before submission

### User Detail Modal - Multiplier Management
- Table showing current multipliers per quiz type (simple-math, simple-words, etc.)
- Editable multiplier values with validation (positive numbers, reasonable ranges)
- Bulk update option for setting same multiplier across all quiz types
- Historical multiplier change tracking (optional future enhancement)

### Confirmation & Feedback
- Confirm dialogs for all credit/multiplier changes
- Success/error toast notifications for API responses
- Loading indicators during API calls
- Auto-refresh of user list after successful updates

### Navigation & State Management
- Modal stacking support (login → user list → user detail)
- Breadcrumb navigation showing current context
- Persistent admin session until explicit logout or token expiry
- Graceful handling of expired tokens with re-authentication prompt

## Implementation Details

### Frontend File Structure
```
client/public/js/admin/
├── admin-auth.js        # Admin authentication and token management
├── admin-ui.js          # Modal creation and UI rendering utilities
├── user-manager.js      # User list fetching and pagination logic
├── credit-editor.js     # Credit adjustment interface and validation
├── multiplier-editor.js # Multiplier management interface
└── admin-main.js        # Main admin module initialization
```

### Integration with Existing Codebase
- **Minimal disruption**: Admin modals injected into existing DOM without modifying core quiz logic
- **Shared utilities**: Reuse existing API client functions for authenticated requests
- **CSS isolation**: Admin-specific styles in `admin.css` with distinct color palette
- **Event handling**: Admin events isolated from quiz events using event delegation

### API Integration Layer
1. **Authentication**: POST to `/auth/login` with admin credentials → store JWT
2. **User listing**: GET `/admin/users?page=1&limit=20` with admin token
3. **Credit updates**: PATCH `/admin/users/:userId/credits` with `{ earned: X, claimed: Y }`
4. **Multiplier updates**: PATCH `/admin/users/:userId/multiplier` with `{ quizType: "simple-math", multiplier: 2.5 }`

### State Management Strategy
- **Session storage**: Admin JWT token stored in sessionStorage (cleared on logout)
- **Modal state**: JavaScript objects tracking current modal stack and selected user
- **User data caching**: Local caching of paginated user lists for better performance
- **Validation state**: Real-time validation feedback for credit adjustments

### Error Handling & Edge Cases
- **Token expiry**: Automatic redirect to admin login when 401 received
- **Network errors**: Graceful degradation with retry mechanisms
- **Concurrent edits**: Optimistic updates with rollback on conflict
- **Large user lists**: Virtual scrolling for lists exceeding 100 users

### Testing Strategy
- **Unit tests**: Individual admin component functions
- **Integration tests**: Admin API interactions with mocked backend
- **E2E tests**: Complete admin workflow using Playwright
- **Security tests**: Verify admin endpoints reject non-admin users

## Implementation Steps

### Phase 1: Foundation
1. Create admin JavaScript module structure in `client/public/js/admin/`
2. Implement admin authentication system with JWT token management
3. Create basic modal system with distinct admin styling
4. Add admin login modal with form validation

### Phase 2: User Management
1. Implement user list fetching with pagination from `/admin/users` endpoint
2. Create user management modal with search and pagination controls
3. Add user selection and detail view navigation
4. Implement user detail modal skeleton

### Phase 3: Credit Management
1. Create credit editor component with absolute/relative adjustment modes
2. Implement real-time validation for credit adjustments
3. Add confirmation dialogs and API integration for credit updates
4. Test credit adjustment flow end-to-end

### Phase 4: Multiplier Management
1. Create multiplier editor table showing all quiz types
2. Implement multiplier validation and bulk update functionality
3. Add API integration for multiplier updates
4. Test multiplier adjustment flow end-to-end

### Phase 5: Polish & Testing
1. Add loading states and error handling
2. Implement token expiry handling and re-authentication
3. Add comprehensive E2E tests for admin workflows
4. Perform security testing and validation

## File Changes

### Frontend Files
1. `client/public/js/admin/` - New directory for admin modules
2. `client/public/css/admin.css` - Admin-specific styles
3. `client/public/index.html` - Add admin modal containers and script references
4. `client/public/js/main.js` - Minimal integration to expose admin entry point

### Backend Integration
1. **No backend changes required** - Uses existing admin API endpoints
2. **Authentication unchanged** - Uses existing JWT system with `isAdmin` flag
3. **API endpoints unchanged** - Uses existing `/admin/users` and related endpoints

### Configuration Files
1. `package.json` - Add any necessary dev dependencies for admin UI
2. `.env.example` - Document any admin-specific configuration variables

## Success Criteria
1. Admin users can log in through separate admin login screen
2. Admin interface appears as distinct modal overlay on quiz interface
3. Admins can browse paginated user list and search for users
4. Admins can adjust both earned and claimed credits for any user
5. Admins can adjust quiz multipliers for any user and quiz type
6. All changes are validated and confirmed before submission
7. Admin session persists until explicit logout or token expiry
8. Non-admin users cannot access admin functionality
9. Existing quiz functionality remains unaffected by admin system