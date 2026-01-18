# Types API Documentation

This document describes the type definitions used throughout the application.

## Overview

The types directory contains TypeScript type definitions that provide type safety and structure to the application. These definitions are used across services, controllers, and other modules.

## Type Definitions

### UUID Type Definition
- **File**: `src/server/types/uuid.d.ts`
- **Purpose**: Provides TypeScript definition for UUID type
- **Details**: Defines UUID as a string with specific format validation

## Type Usage Across Application

### User Type
Used throughout authentication and database modules:
- `id`: string - Unique user identifier
- `username`: string - User's username
- `passwordHash`: string - Hashed password
- `createdAt`: Date - When user was created
- `earned_credits`: number - Total earned credits
- `claimed_credits`: number - Total claimed credits
- `isParent`: boolean - Whether user has admin privileges

### Session Types
Used in session management:
- `Session` - Base session type
- `SimpleWordsSession` - Words-based session type
- Various question types (MathQuestion, FractionComparisonQuestion, FactorsQuestion, SimpleWords)

### Credit Types
- `UserCredits` - Interface for credit tracking
- `CreditService` - Methods for credit management

### Database Types
- `DatabaseOperations` - Interface for database operations
- Various data structures for database entities

## Implementation Details

### Type Safety
All type definitions are used to:
- Ensure consistent data structures
- Provide compile-time checking
- Improve code maintainability
- Enable better IDE support

### Extensibility
Types are designed to be extensible:
- Interfaces allow for extension
- Generic types provide flexibility
- Union types support multiple value types

## Integration

Type definitions are integrated throughout:
- Service layers
- Controller layers
- Database operations
- API request/response structures

## Benefits

Using TypeScript types provides:
- Compile-time error detection
- Better IDE support with auto-completion
- Improved code documentation
- Easier refactoring
- Enhanced code quality