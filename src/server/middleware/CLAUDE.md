# Middleware API Documentation

This document describes the middleware functions used in the application for authentication and authorization.

## Overview

The middleware layer provides essential security and access control for API endpoints. It ensures that only authenticated and authorized users can access protected resources.

## Middleware Functions

### authenticate
- **Path**: `/src/server/middleware/auth.middleware.ts`
- **Purpose**: Authenticates requests using JWT tokens
- **Usage**: Applied to endpoints requiring user authentication
- **Behavior**:
  - Extracts JWT token from Authorization header
  - Verifies token validity
  - Adds user information to request object if authentication succeeds
  - Returns 401 error if token is missing or invalid

### requireAdmin
- **Path**: `/src/server/middleware/parent.middleware.ts`
- **Purpose**: Restricts access to admin-only endpoints
- **Usage**: Applied to endpoints requiring admin privileges
- **Behavior**:
  - First applies the standard authentication middleware
  - Verifies that the authenticated user has admin privileges
  - Returns 403 error if user lacks admin permissions

## Implementation Details

### Token Authentication
- Uses JWT (JSON Web Tokens) for stateless authentication
- Tokens are expected in the Authorization header with "Bearer " prefix
- Token verification uses the authService for JWT decoding and validation

### Admin Authorization
- Admin users are identified by the `isAdmin` flag in user records
- The parent user (username: "parent") has admin privileges by default
- Admin privileges are checked at runtime for each request

## Security Considerations

- All sensitive endpoints are protected by authentication middleware
- Admin endpoints require additional authorization checks
- JWT tokens include expiration times for security
- Tokens are validated on every request to ensure session integrity

## Usage Example

```typescript
// In controller files
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/parent.middleware';

// Protect endpoint with authentication
router.get('/profile', authenticate, (req, res) => {
  // User is authenticated, access user info via req.user
});

// Protect endpoint with admin privileges
router.patch('/users/:userId/multiplier', requireAdmin, (req, res) => {
  // User is authenticated and has admin privileges
});
```

## Integration

The middleware functions are integrated into the main application in `src/server/index.ts`:
- `authenticate` is used for general user authentication
- `requireAdmin` is used for admin-only endpoints