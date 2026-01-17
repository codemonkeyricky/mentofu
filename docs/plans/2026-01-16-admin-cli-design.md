# Admin CLI Design

## Overview
Create a CLI tool and admin API endpoints to manage user multipliers and credits. The CLI connects to admin API endpoints that extend the existing authentication system with admin role support. This approach enables both CLI usage and future admin UI development.

## Requirements
From cli.txt:
- Update multiplier per user per quiz type
- Update earned credits per user
- Update claimed credits per user

Additional requirements:
- Support both in-memory (local dev) and PostgreSQL (production) database modes
- Use existing JWT authentication with admin role extension
- Command-based CLI interface with clear subcommands
- RESTful API endpoints integrated with existing `/api` routes
- Integer multipliers only (database stores INTEGER type)

## Architecture

### Components
1. **Admin Role Extension**: Add `isAdmin` flag to User model and database schema
2. **Admin Middleware**: JWT verification with admin role check
3. **Admin API Endpoints**: RESTful endpoints protected by admin middleware
4. **CLI Tool**: TypeScript/Node.js CLI that authenticates and calls admin endpoints
5. **Database Layer**: Existing `DatabaseService` used unchanged

### Authentication Flow
- CLI authenticates using existing `/api/auth/login` endpoint with admin credentials
- JWT token includes `isAdmin: true` claim
- Admin middleware verifies token and admin role for all admin endpoints
- CLI includes token in `Authorization: Bearer <token>` header

### Database Schema Updates
- Add `is_admin BOOLEAN DEFAULT FALSE` column to `users` table
- Migration required for existing PostgreSQL deployments
- In-memory database handles via schema definition

## API Endpoint Design

All endpoints use `requireAdmin` middleware and follow RESTful patterns.

### 1. Update Multiplier
```
PATCH /api/users/:userId/multiplier
```
**Request:**
```json
{
  "quizType": "simple-math",
  "multiplier": 2
}
```
**Validation:**
- `quizType`: Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-words
- `multiplier`: INTEGER ≥ 0 (0 disables quiz type)

**Logic:** Calls `DatabaseService.setUserMultiplier(userId, quizType, multiplier)`

### 2. Update Credits
```
PATCH /api/users/:userId/credits
```
**Request:**
```json
{
  "earnedCredits": 100,
  "claimedCredits": 50,
  "earnedDelta": 10,
  "claimedDelta": -5
}
```
**Validation:**
- At least one credit field required
- Integers only, ≥ 0 for absolute values
- `claimedCredits ≤ earnedCredits` (enforced by CreditService)
- Supports absolute setting or relative adjustments

**Logic:** Uses `DatabaseService.updateUserCredits()` with atomic updates

### 3. List Users (Admin View)
```
GET /api/admin/users?search=username&limit=20
```
**Response:**
```json
{
  "users": [
    {
      "id": "...",
      "username": "student1",
      "earnedCredits": 150,
      "claimedCredits": 100,
      "multipliers": {
        "simple-math": 1,
        "simple-words": 2
      }
    }
  ]
}
```
**Purpose:** Helps CLI users find user IDs and see current state

## CLI Tool Design

### Command Structure
```
quiz-admin [global-options] <command> [command-options]
```

### Global Options
- `--api-url`: API base URL (default: http://localhost:3000)
- `--username`: Admin username (required for auth)
- `--password`: Admin password (required for auth)
- `--token`: Direct JWT token (alternative to username/password)
- `--verbose`: Show detailed output
- `--dry-run`: Validate without making changes

### Commands

#### 1. Update Multiplier
```bash
quiz-admin update-multiplier \
  --user <userId|username> \
  --quiz-type <quiz-type> \
  --value <integer-multiplier>
```
**Options:**
- `--user`: Required - user ID or username (CLI resolves)
- `--quiz-type`: Required - valid quiz type
- `--value`: Required - INTEGER multiplier (≥ 0)
- `--list-types`: List valid quiz types

#### 2. Update Credits
```bash
quiz-admin update-credits \
  --user <userId|username> \
  --earned <value> \
  --claimed <value> \
  --earned-delta <+/-value> \
  --claimed-delta <+/-value>
```
**Options:**
- At least one credit option required
- Integers only
- Supports absolute values or relative adjustments

#### 3. List Users
```bash
quiz-admin list-users \
  --search <username> \
  --limit <number> \
  --show-multipliers \
  --show-credits
```

#### 4. Get User Info
```bash
quiz-admin get-user --user <userId|username>
```

### CLI Implementation Details
- **Language**: TypeScript for type safety
- **HTTP Client**: `axios` or `node-fetch`
- **CLI Framework**: `commander.js`
- **Configuration**: `.env` file support for default credentials
- **Location**: `src/cli/` directory within existing codebase
- **Build**: Included in `npm run build` output

## Error Handling

### API Error Responses
1. **400 Bad Request**: Validation failures
2. **401 Unauthorized**: Missing/invalid JWT token
3. **403 Forbidden**: User not admin
4. **404 Not Found**: User not found
5. **409 Conflict**: Business logic violations
6. **500 Internal Server Error**: Unexpected exceptions

### CLI Error Handling
- Network errors with retry logic
- Authentication failures with clear instructions
- User-friendly error messages with suggestions
- `--dry-run` flag for validation without changes

### Validation Rules
- **Multiplier**: INTEGER ≥ 0
- **Credits**: INTEGER ≥ 0, claimed ≤ earned
- **Quiz Types**: Must match existing 6 quiz types
- **User References**: Accepts ID or username, validates existence

## Implementation Steps

### Phase 1: Backend Changes
1. Extend User model with `isAdmin` field
2. Create database migration for `is_admin` column
3. Implement `requireAdmin` middleware
4. Add admin API endpoints
5. Update existing authentication to include `isAdmin` in JWT

### Phase 2: CLI Tool
1. Set up CLI project structure in `src/cli/`
2. Implement authentication helper
3. Implement command handlers for each operation
4. Add configuration and error handling
5. Create build script and entry point

### Phase 3: Testing
1. Unit tests for admin middleware
2. Integration tests for admin endpoints
3. CLI functional tests
4. End-to-end test scenarios

## File Changes

### Backend Files
1. `src/server/auth/auth.types.ts` - Extend User interface
2. `src/server/database/database.service.ts` - Schema update
3. `src/server/middleware/admin.middleware.ts` - New file
4. `src/server/routes/*.ts` - Add admin endpoints
5. `src/server/auth/auth.service.ts` - Include isAdmin in JWT

### CLI Files
1. `src/cli/cli.ts` - Main entry point
2. `src/cli/commands/` - Command implementations
3. `src/cli/auth.ts` - Authentication helper
4. `src/cli/config.ts` - Configuration management
5. `src/cli/package.json` - CLI dependencies (if separate)

### Configuration Files
1. `package.json` - Add CLI build script
2. `tsconfig.json` - Include CLI in build
3. `.env.example` - Add CLI configuration variables

## Dependencies
- Existing authentication system (JWT)
- Existing `DatabaseService` and `CreditService`
- `commander.js` for CLI parsing
- `axios` or `node-fetch` for HTTP requests
- `dotenv` for configuration

## Success Criteria
1. Admin users can authenticate and obtain JWT tokens with admin claim
2. Admin middleware correctly blocks non-admin users
3. All three operations work via API endpoints
4. CLI tool successfully authenticates and executes all commands
5. Multiplier and credit updates persist correctly
6. Error handling provides clear feedback for all failure modes
7. Existing user functionality unaffected by admin system