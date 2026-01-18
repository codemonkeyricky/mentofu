# Parent/Admin API Documentation

This document describes the API endpoints and interfaces for administrative functions in the application.

## Overview

The parent/admin API provides endpoints for administrators to manage users, their credits, and multipliers. It's designed to be used by the parent user (admin) to perform administrative tasks.

## API Endpoints

### Update User Multiplier
- **PATCH `/parent/users/:userId/multiplier`** - Update a user's multiplier for a specific quiz type
  - Request body: `{ "quizType": string, "multiplier": number }`
  - Response: `{ "message": "Multiplier updated successfully", "userId": string, "quizType": string, "multiplier": number }`

### Update User Credits
- **PATCH `/parent/users/:userId/credits`** - Update a user's credit balances
  - Request body: `{ "earnedCredits": number, "claimedCredits": number, "earnedDelta": number, "claimedDelta": number }`
  - Response: `{ "message": "Credits updated successfully", "userId": string, "earnedCredits": number, "claimedCredits": number }`

### Get All Users
- **GET `/parent/users`** - Get list of all users with their credit and multiplier information
  - Query parameters: `search` (optional), `limit` (optional)
  - Response: `{ "users": [UserWithCredits] }`

### Get Specific User
- **GET `/parent/users/:userId`** - Get a specific user's information
  - Response: `{ "id": string, "username": string, "earnedCredits": number, "claimedCredits": number, "multipliers": { [quizType: string]: number } }`

## Interface Description

### AdminRouter
The parent module exposes the `adminRouter` which provides REST endpoints for:
- PATCH `/parent/users/:userId/multiplier` - Update user multiplier
- PATCH `/parent/users/:userId/credits` - Update user credits
- GET `/parent/users` - Get all users
- GET `/parent/users/:userId` - Get specific user

### Validation Functions
- `validateQuizType(quizType: string): boolean` - Validates that a quiz type is supported
- `getUserByIdOrUsername(idOrUsername: string): Promise<User | null>` - Helper to find user by ID or username

## Implementation Details

### Admin Authentication
- All endpoints require admin privileges via `requireAdmin` middleware
- The parent user (username: "parent") is automatically granted admin privileges
- Authentication uses JWT tokens with proper verification

### Data Validation
- Quiz type validation ensures only supported quiz types can be used
- Credit value validation ensures non-negative integers
- Credit balance validation prevents claimed credits from exceeding earned credits

### Data Management
- Uses database service for all data operations
- Supports both absolute credit values and delta-based updates
- Maintains consistent user state across all operations

## Data Structures

### UserWithCredits Interface
- `id`: string - User ID
- `username`: string - User's username
- `earnedCredits`: number - Total earned credits
- `claimedCredits`: number - Total claimed credits
- `multipliers`: Record<string, number> - Multipliers for each quiz type

### Supported Quiz Types
- `simple-math`
- `simple-math-2`
- `simple-math-3`
- `simple-math-4`
- `simple-math-5`
- `simple-words`

## Security Considerations

- All endpoints are protected by admin middleware
- Admin privileges are restricted to the parent user
- Input validation prevents invalid data from being saved
- All operations are logged for audit purposes
- Credit updates are validated to maintain data integrity

## Usage Examples

```typescript
// Update user multiplier for math quiz
PATCH /parent/users/user123/multiplier
{
  "quizType": "simple-math",
  "multiplier": 2
}

// Update user credits
PATCH /parent/users/user123/credits
{
  "earnedCredits": 100,
  "claimedCredits": 50
}
```