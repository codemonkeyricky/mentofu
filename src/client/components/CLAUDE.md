# ParentDashboard Component

This component implements the parent dashboard functionality for the Mentofu educational platform. It provides a centralized interface for parents to manage user accounts, view credit information, and adjust multipliers for different quiz types.

## Overview

The ParentDashboard component fetches user data from the server's `/parent/users` API endpoint and displays it in a comprehensive management interface. It allows parents to:
- View user accounts and their credit information (earned and claimed)
- Adjust multipliers for different quiz types
- See statistics about total users and credits

## Key Features

### Data Fetching and Display
- Fetches user data from `/parent/users` API endpoint
- Handles authentication by checking for JWT token in localStorage
- Displays user information in a table format with credit details
- Shows statistics cards for total users, earned credits, and claimed credits

### Multiplier Management
- Allows editing of multipliers for different quiz types (e.g., math, spelling, etc.)
- Provides inline editing interface for multiplier values
- Implements optimistic updates for better user experience
- Handles error recovery by reverting changes on API failure

### User Interface
- Responsive table layout for displaying user data
- Interactive multiplier editing with save/cancel functionality
- Loading and error states for better user experience
- Statistics dashboard showing key metrics

## Technical Details

### API Interactions
- GET `/parent/users` - Fetches all user data
- PATCH `/parent/users/:userId/multiplier` - Updates multiplier for a specific user and quiz type

### Data Structure
The component expects data in the following format from the API:
```json
{
  "users": [
    {
      "id": "user-id",
      "username": "username",
      "earnedCredits": 100,
      "claimedCredits": 50,
      "multipliers": {
        "math": 2,
        "spelling": 1
      }
    }
  ]
}
```

### State Management
- `users`: Array of ParentDashboardUser objects
- `loading`: Boolean indicating if data is being fetched
- `error`: String containing error message if fetching fails
- `editingMultiplier`: Object tracking which multiplier is currently being edited
- `updateLoading`: Boolean indicating if an update operation is in progress

## Security Considerations

- Authentication is handled through JWT tokens stored in localStorage
- All API requests include the Authorization header with the Bearer token
- The component redirects to the login page if no valid token is found
- Token validation is performed before any API calls

## Dependencies

- React (useState, useEffect hooks)
- ParentDashboardUser type from `../types`
- CSS classes for styling (`.parent-dashboard-container`, `.loading`, `.error`, etc.)

## Usage

This component is used within the ParentDashboardPage component and should be wrapped in a proper authentication context that ensures only parent users can access it.