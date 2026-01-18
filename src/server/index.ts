# Server Entry Point API Documentation

This document describes the main server entry point and its role in the application.

## Overview

The `index.ts` file serves as the main entry point for the server application. It initializes the Express application, sets up middleware, configures routes, and manages database connections.

## Application Structure

### Main Components
- Express application instance
- Database service initialization
- Middleware setup
- Route configuration
- Server startup

### File Location
- **Path**: `src/server/index.ts`

## API Endpoints

The server exposes the following API endpoints:

### Authentication
- **POST `/auth/register`** - Register a new user
- **POST `/auth/login`** - Login with username/password

### Session Management
- **GET `/session/:quizType`** - Create a new quiz session
- **POST `/session/:quizType`** - Submit quiz answers and get score
- **GET `/session/scores/:sessionId`** - Get score for a specific session
- **GET `/session/scores`** - Get all scores for current user
- **GET `/session/all`** - Get all sessions for current user
- **GET `/session/multiplier/:quizType`** - Get user multiplier for a quiz type
- **POST `/session/multiplier/:quizType`** - Set user multiplier for a quiz type

### Credit Management
- **GET `/credit/earned`** - Get earned credits for user
- **POST `/credit/earned`** - Add to earned credits
- **GET `/credit/claimed`** - Get claimed credits for user
- **POST `/credit/claimed`** - Add to claimed credits

### Admin Functions
- **PATCH `/parent/users/:userId/multiplier`** - Update user multiplier (admin only)
- **PATCH `/parent/users/:userId/credits`** - Update user credits (admin only)
- **GET `/parent/users`** - Get all users (admin only)
- **GET `/parent/users/:userId`** - Get specific user (admin only)

### Utility Endpoints
- **GET `/`** - Health check endpoint
- **GET `/endpoints`** - List all available endpoints
- **GET `/*`** - Serve frontend (SPA fallback)

## Middleware

### Built-in Middleware
- JSON parsing (`express.json()`)
- CORS handling
- Static file serving for frontend

### Custom Middleware
- `authenticate` - Authentication middleware for user endpoints
- `requireAdmin` - Authorization middleware for admin endpoints

## Database Integration

The server integrates with the database through:
- `DatabaseService` - Main database abstraction layer
- Connection management for both in-memory and PostgreSQL backends
- Service dependency injection for:
  - `authService` - Authentication service
  - `sessionService` - Session management service
  - `creditService` - Credit management service

## Environment Configuration

The server automatically:
- Loads environment variables from `.env` file
- Selects database backend based on `POSTGRES_URL` environment variable
- Uses in-memory database for local development
- Uses PostgreSQL for production deployment

## Server Configuration

### Port
- Default port: 4000 (configurable via `PORT` environment variable)

### Security
- CORS configuration for cross-origin requests
- JWT-based authentication
- Admin authorization for privileged endpoints

## Implementation Details

### Initialization Process
1. Create Express application instance
2. Initialize database service (dynamically selects backend)
3. Connect database service to various services (auth, session, credit)
4. Configure middleware
5. Configure routes
6. Start server (unless in test environment)

### Error Handling
- Comprehensive error handling throughout the application
- Proper HTTP status codes returned for different scenarios
- Error messages are structured consistently

### Testing
- Exported for testing purposes
- Test environment detection to avoid automatic server startup
- Integration with test suite via `test-app.ts`

## Deployment Considerations

### Local Development
- Uses in-memory database by default
- Static file serving for frontend
- CORS enabled for development

### Production Deployment
- Uses PostgreSQL (Vercel Postgres)
- Environment variables for configuration
- Proper error handling for production

## Security Implementation

### Authentication
- JWT token-based authentication
- Password hashing using bcrypt
- Token validation with expiration

### Authorization
- Admin-only endpoints protected with `requireAdmin` middleware
- User-specific data access controls
- Token-based access control for all protected endpoints

## Data Flow

1. Client makes request to API endpoint
2. Request is processed by appropriate middleware
3. Request is routed to appropriate controller
4. Controller calls service layer
5. Service layer interacts with database
6. Database returns data to service
7. Service returns data to controller
8. Controller sends response to client