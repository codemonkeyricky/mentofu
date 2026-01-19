# Parent Module API Interface

This document describes the API endpoints exposed by the parent module, which provides administrative functionality for managing user multipliers and credit balances.

## Authentication and Authorization

All endpoints require:
- Valid JWT token in the Authorization header
- User must have admin privileges (isParent flag set to true)
- Only the hardcoded parent user (username: "parent") has admin access

## Endpoints

### 1. Update User Multiplier
**Endpoint**: `PATCH /parent/users/:userId/multiplier`

**Description**: Updates a user's multiplier for a specific quiz type.

**Request Body**:
```json
{
  "quizType": "string",
  "multiplier": "number"
}
```

**Request Validation**:
- `quizType` must be one of: `simple-math`, `simple-math-2`, `simple-math-3`, `simple-math-4`, `simple-math-5`, `simple-words`
- `multiplier` must be an integer ≥ 0

**Response**:
```json
{
  "message": "Multiplier updated successfully",
  "userId": "string",
  "quizType": "string",
  "multiplier": "number"
}
```

### 2. Update User Credits
**Endpoint**: `PATCH /parent/users/:userId/credits`

**Description**: Updates a user's credit balances.

**Request Body**:
```json
{
  "earnedCredits": "number",
  "claimedCredits": "number",
  "earnedDelta": "number",
  "claimedDelta": "number"
}
```

**Request Validation**:
- At least one credit field must be provided
- Credit values must be non-negative integers
- `claimedCredits` cannot exceed `earnedCredits`

**Response**:
```json
{
  "message": "Credits updated successfully",
  "userId": "string",
  "earnedCredits": "number",
  "claimedCredits": "number"
}
```

### 3. Get All Users
**Endpoint**: `GET /parent/users`

**Description**: Retrieves list of all users with credit and multiplier information.

**Query Parameters**:
- `search` (optional): Search term for user names
- `limit` (optional): Maximum number of users to return

**Response**:
```json
[
  {
    "userId": "string",
    "username": "string",
    "earnedCredits": "number",
    "claimedCredits": "number",
    "multipliers": {
      "simple-math": "number",
      "simple-math-2": "number",
      "simple-math-3": "number",
      "simple-math-4": "number",
      "simple-math-5": "number",
      "simple-words": "number"
    }
  }
]
```

### 4. Get Specific User
**Endpoint**: `GET /parent/users/:userId`

**Description**: Retrieves specific user's information.

**Response**:
```json
{
  "userId": "string",
  "username": "string",
  "earnedCredits": "number",
  "claimedCredits": "number",
  "multipliers": {
    "simple-math": "number",
    "simple-math-2": "number",
    "simple-math-3": "number",
    "simple-math-4": "number",
    "simple-math-5": "number",
    "simple-words": "number"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": "string",
  "message": "string"
}
```

Common error codes:
- 401: Unauthorized (invalid or missing token)
- 403: Forbidden (insufficient privileges)
- 404: Not Found (user not found)
- 400: Bad Request (invalid request body or parameters)
- 500: Internal Server Error (server-side issues)

## Supported Quiz Types

The following quiz types are supported for multiplier updates:
- `simple-math`
- `simple-math-2`
- `simple-math-3`
- `simple-math-4`
- `simple-math-5`
- `simple-words`

## Data Structures

### UserWithCredits
- `userId`: string - User ID
- `username`: string - User's username
- `earnedCredits`: number - Total earned credits
- `claimedCredits`: number - Total claimed credits
- `multipliers`: Record<string, number> - Multipliers for each quiz type