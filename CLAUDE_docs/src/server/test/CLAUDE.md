# Test Suite API Documentation

This document describes the test suite structure and testing approach for the application.

## Overview

The test suite provides comprehensive testing for all server-side components including controllers, services, and database operations. It ensures code quality, functionality, and reliability.

## Test Structure

### Test Files
The test directory contains the following test files:
- `database.test.util.ts` - Database testing utilities
- `session.test.ts` - Session service tests
- `session.controller.test.ts` - Session controller tests
- `test-app.ts` - Test application setup
- `credit.service.test.ts` - Credit service tests
- `credit.controller.test.ts` - Credit controller tests
- `parent.test.ts` - Parent/admin tests
- `integration.test.ts` - Integration tests
- `parent-login.e2e.test.ts` - End-to-end tests for parent login

## Testing Approach

### Unit Tests
- Test individual functions and methods in isolation
- Use mocking and stubbing where appropriate
- Focus on service layer logic and business rules

### Integration Tests
- Test interactions between components
- Verify that controllers properly call services
- Validate data flow through the system

### End-to-End Tests
- Test complete user workflows
- Include authentication and authorization
- Verify full API endpoint functionality

### Test Utilities
- `database.test.util.ts` - Provides test database setup and cleanup
- `test-app.ts` - Sets up the test application instance

## Test Coverage

### Database Tests
- Database service initialization
- User creation and retrieval
- Session score management
- Credit management
- Multiplier management

### Session Tests
- Session creation
- Answer submission and scoring
- Session score retrieval
- Multiplier handling

### Credit Tests
- Credit balance management
- Credit addition and claiming
- Credit validation

### Parent/Admin Tests
- Admin privilege validation
- User credit modification
- User multiplier modification
- User search and retrieval

## Implementation Details

### Test Framework
- Uses Jest for testing framework
- Uses supertest for HTTP testing
- Implements proper test setup and teardown

### Database Testing
- Uses in-memory database for fast tests
- Provides utilities for test database cleanup
- Ensures test isolation

### Authentication Testing
- Tests token generation and verification
- Tests authentication middleware
- Tests admin authorization middleware

## Running Tests

Tests can be run using npm scripts:
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage reporting

## Test Data

Test data includes:
- Mock users with various permissions
- Test sessions with different question types
- Test credit scenarios
- Test multipliers for different quiz types

## Security Testing

Tests include:
- Authentication validation
- Authorization checks
- Input validation
- Error handling

## Code Coverage

The test suite aims for comprehensive coverage of:
- All service methods
- All controller endpoints
- Database operations
- Middleware functions
- Error handling scenarios