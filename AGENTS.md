# System Architecture & Testing Guide

*Note: This document (AGENTS.md) provides comprehensive architecture documentation and testing requirements for the quiz application. The name "AGENTS" reflects the systematic approach to managing system components and change validation.*

## Overview

The Quiz Application is an educational platform featuring interactive multiplication quizzes with a 3D forest visualization. The system consists of a REST API backend, a web-based frontend with Three.js 3D graphics, and a dual-mode database layer supporting both in-memory development and PostgreSQL production deployments.

### Key Characteristics
- **Type**: Educational quiz platform with gamification elements
- **Architecture**: Client-server with service layer pattern
- **Database**: Dual-mode (in-memory singleton for dev, Vercel PostgreSQL for production)
- **Authentication**: JWT token-based with middleware protection
- **Frontend**: Vanilla JavaScript with Three.js for 3D visualization
- **Testing**: Comprehensive suite including Jest unit tests, Playwright and Cypress E2E tests

## Architecture Components

### 1. Backend Server (`src/server/`)
```
src/server/
├── index.ts              # Express app initialization and routing
├── auth/                 # Authentication system
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.types.ts
├── session/             # Quiz session management
├── credit/              # Credit system with earned/claimed tracking
├── admin/               # Administrative functionality (CLI and API)
├── database/            # Dual-mode database service
│   └── database.service.ts
├── middleware/          # Authentication and admin middleware
├── test/               # Backend test suite
└── utils/              # Utility functions
```

### 2. Frontend Client (`src/client/`)
```
src/client/
├── public/
│   ├── js/              # JavaScript modules
│   │   ├── main.js              # Application entry point and core logic
│   │   ├── modules/             # Quiz type implementations
│   │   │   ├── quiz-manager.js  # Central quiz coordination
│   │   │   ├── quiz-base.js     # Base quiz class
│   │   │   ├── math-quiz.js     # Multiplication quiz
│   │   │   ├── factors-quiz.js  # Factors quiz
│   │   │   ├── fraction-quiz.js # Fractions quiz
│   │   │   ├── spelling-quiz.js # Spelling quiz
│   │   │   ├── bodmas-quiz.js   # BODMAS quiz
│   │   │   └── division-quiz.js # Division quiz
│   │   ├── animation-loop.js    # 3D animation rendering
│   │   ├── scene-setup.js       # Three.js scene initialization
│   │   ├── gui-controls.js      # User interface controls
│   │   ├── textures.js          # Texture loading and management
│   │   └── config.js            # Configuration constants
│   ├── css/             # Stylesheets
│   └── shaders/         # Three.js shader programs (GLSL)
├── forest.ts            # Main 3D scene with Three.js (TypeScript)
└── index.html           # Main HTML entry point
```

### 3. CLI Tool (`src/cli/`)
- Admin command-line interface for system management
- Built with TypeScript, compiled separately via `npm run build:cli`

### 4. Testing Infrastructure
```
e2e/                    # Playwright end-to-end tests
src/server/test/        # Jest unit and integration tests
test-results/           # Test output and reports
```

## Data Flow

### Authentication Flow
1. User registers via `/auth/register` → `authService.createUser()`
2. Credentials validated and hashed with bcrypt
3. JWT token issued on successful login via `/auth/login`
4. Token included in `Authorization: Bearer <token>` header for protected routes
5. `authMiddleware` validates token on each protected request

### Quiz Session Flow
1. User starts quiz session → `sessionService.createSession()`
2. Questions generated based on quiz type (math, factors, fractions, spelling)
3. Answers submitted → `sessionService.submitAnswer()`
4. Score calculated with multiplier adjustments
5. Session results saved via `databaseService.saveSessionScore()`

### Credit System Flow
1. Credits earned through quiz completion → `creditService.addEarnedCredits()`
2. Credits claimed via UI → `creditService.claimCredits()`
3. Balance validation prevents over-claiming
4. Multiplier badges enhance credit earning rates

## Database Architecture

### Dual-Mode Strategy
The system automatically switches between database backends based on environment:

```typescript
// DatabaseService constructor logic
this.databaseType = process.env.POSTGRES_URL ? 'vercel-postgres' : 'memory';
```

**In-Memory Mode (Development)**:
- Singleton `MemoryDatabase` class with Map-based storage
- Auto-cleared on server restart
- Used for local development and testing

**PostgreSQL Mode (Production)**:
- Vercel Postgres with connection pooling
- Automatic table creation and migrations
- Production-ready with ACID compliance

### Data Models
- **Users**: `id`, `username`, `password_hash`, `created_at`, `earned_credits`, `claimed_credits`, `is_admin`
- **Session Scores**: `id`, `user_id`, `session_id`, `score`, `total`, `session_type`, `multiplier`, `completed_at`
- **User Multipliers**: `user_id`, `quiz_type`, `multiplier` (composite primary key)

## Testing Strategy

### 1. Unit Tests (Jest)
**Location**: `src/server/test/`
**Pattern**: Service layer testing with mocked dependencies

```typescript
// Example test pattern
describe('CreditService', () => {
  beforeEach(() => {
    // Clear database before each test
    dbService.clearMemoryDatabase();
  });

  it('should add earned credits', async () => {
    const result = await creditService.addEarnedCredits(userId, 100);
    expect(result).toBeDefined();
  });
});
```

**Test Execution**:
```bash
npm test                           # Run all Jest tests
npm test -- testname               # Run specific test file
npm test -- --coverage             # Generate coverage report
```

### 2. Integration Tests (Supertest + Jest)
**Location**: `src/server/test/integration.test.ts`
**Focus**: End-to-end API flows with authentication

```typescript
// Force memory database for tests
delete process.env.POSTGRES_URL;

describe('Integration Tests', () => {
  beforeEach(() => {
    const dbService = new DatabaseService();
    dbService.clearMemoryDatabase();
  });

  it('should complete full auth and credit flow', async () => {
    // Register → Login → Earn Credits → Claim Credits
  });
});
```

### 3. End-to-End Tests
**Playwright**: `e2e/` - Multi-browser testing with CI configuration
```bash
npm run playwright                 # Run Playwright tests
npm run playwright:ui              # Open Playwright UI
```

### 4. Test Configuration
- **Jest**: `jest.config.js` with TypeScript support via `ts-jest`
- **Playwright**: `playwright.config.ts` with multi-browser setup

## Development Workflow

### Local Development
```bash
npm run dev                        # Start server and client concurrently
npm run dev:server                 # Server only (with nodemon)
npm run dev:client                 # Client only (Vite dev server)
```

### Building for Production
```bash
npm run build                      # Build both server and client
npm run build:server               # TypeScript compilation for server
npm run build:client               # Vite build for client
npm run build:cli                  # Build CLI tool separately
```

### Database Management
**Local Development**: Automatically uses in-memory database
**Production**: Set `POSTGRES_URL` environment variable for Vercel Postgres

## Deployment Architecture

### Vercel Deployment
- Serverless functions for API endpoints
- Static assets served from `dist/public/`
- Automatic PostgreSQL integration via `@vercel/postgres`
- Environment variables: `POSTGRES_URL`, `JWT_SECRET`

### Configuration Files
- `vercel.json`: Deployment configuration
- `tsconfig.server.json`: TypeScript configuration for server
- `vite.config.ts`: Vite build configuration

## Change Management & Testing Requirements

### Pre-Change Checklist
1. **Understand Impact**: Identify affected components (frontend, backend, database)
2. **Review Dependencies**: Check package.json for version compatibility
3. **Database Considerations**:
   - Schema changes require migration scripts
   - Backward compatibility for existing data
   - Dual-mode database implications

### Mandatory Test Execution

**For every change**, the following test commands must be executed locally before committing code:

```bash
npm test                     # Run Jest unit and integration tests
npm run playwright           # Run Playwright end-to-end tests
```

**Purpose**: These tests validate that changes do not break existing functionality and maintain system stability. While the CI pipeline will also run these tests, local execution catches issues early and reduces pipeline failures.

### Testing Requirements for Changes

#### Backend Changes
- [ ] Unit tests updated/added for modified services
- [ ] Integration tests cover API endpoint changes
- [ ] Authentication middleware tests for protected routes
- [ ] Database operation tests for both memory and PostgreSQL modes
- [ ] Error handling and edge cases tested
- [ ] Mandatory test suite executed (`npm test && npm run playwright`)

#### Frontend Changes
- [ ] User interaction flows tested end-to-end
- [ ] 3D visualization performance validated
- [ ] Cross-browser compatibility (Playwright multi-browser)
- [ ] Mandatory test suite executed (`npm test && npm run playwright`)

#### Database Changes
- [ ] Migration script tested locally
- [ ] Rollback procedure documented
- [ ] Data integrity verified after migration
- [ ] Both database modes tested (memory and PostgreSQL)
- [ ] Mandatory test suite executed (`npm test && npm run playwright`)

#### CLI Changes
- [ ] Command parsing tests added
- [ ] Admin permission validation tested
- [ ] Integration with API endpoints verified
- [ ] Mandatory test suite executed (`npm test && npm run playwright`)

### Post-Change Validation
1. **Run Full Test Suite**:
   ```bash
   npm test
   npm run playwright
   ```

2. **Build Verification**:
   ```bash
   npm run build
   npm start  # Verify production build works
   ```

3. **Database Migration Testing**:
   - Test with existing data
   - Verify backward compatibility
   - Performance impact assessment

### Quality Gates
- **Test Coverage**: Minimum 80% coverage for new code
- **Type Safety**: No TypeScript errors in strict mode
- **Linting**: Code follows established patterns
- **Performance**: No significant regression in load times
- **Security**: Authentication and authorization intact

## Monitoring & Observability

### Logging
- Console logging for development
- Structured JSON logs for production (TODO)
- Error tracking and alerting

### Metrics
- API response times
- Database query performance
- User session analytics
- Credit system audit trail

## Future Architecture Considerations

### Scalability Improvements
1. **Caching Layer**: Redis for session storage and API response caching
2. **Message Queue**: Async processing for credit calculations and notifications
3. **CDN**: Static asset delivery optimization
4. **Microservices**: Split quiz, credit, and admin functionality

### Feature Roadmap
1. **Real-time Updates**: WebSocket connections for live quiz competitions
2. **Mobile App**: React Native wrapper for existing API
3. **Analytics Dashboard**: Admin insights into user performance
4. **Social Features**: User profiles, leaderboards, and sharing

---

## Appendix: Key Design Decisions

### 1. Dual-Mode Database
**Decision**: Use in-memory for development, PostgreSQL for production
**Rationale**: Simplifies local setup while maintaining production robustness
**Trade-off**: Additional complexity in DatabaseService implementation

### 2. JWT Authentication
**Decision**: Stateless token-based authentication
**Rationale**: Scalable, works well with serverless architecture
**Trade-off**: Token revocation requires additional mechanism

### 3. Three.js Frontend
**Decision**: Custom 3D visualization instead of game engine
**Rationale**: Lightweight, educational focus on math visualization
**Trade-off**: Steeper learning curve for maintenance

### 4. Multi-Framework Testing
**Decision**: Use Playwright for E2E testing
**Rationale**: Leverage Playwright's multi-browser support and robust test infrastructure
**Trade-off**: Single test framework to maintain

---

*Last Updated: 2026-01-17*
*Maintained by: Development Team*
*Documentation Version: 1.0*