# Database Service API Documentation

This document describes the API endpoints and interfaces for database operations in the application.

## Overview

The database service provides a unified interface for data persistence across different database backends (in-memory for local development, PostgreSQL for production). It manages user data, session scores, multipliers, and credit information.

## Interface Description

### DatabaseOperations Interface

The DatabaseService implements the following interface:

#### Methods:
- `initVercelPostgres(): Promise<void>` - Initialize PostgreSQL tables if needed
- `createUser(user: Omit<User, 'createdAt'>): Promise<User>` - Create a new user
- `findUserByUsername(username: string): Promise<User | null>` - Find a user by username
- `findUserById(userId: string): Promise<User | null>` - Find a user by ID
- `saveSessionScore(userId: string, sessionId: string, score: number, total: number, sessionType: string, multiplier: number): Promise<void>` - Save a session score
- `getSessionScore(sessionId: string): Promise<{ score: number, total: number, multiplier?: number } | null>` - Get a session score by ID
- `getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date, multiplier?: number }>>` - Get all session scores for a user
- `getUserSessionHistory(userId: string): Promise<any[]>` - Get user session history
- `setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void>` - Set user multiplier for a quiz type
- `getUserMultiplier(userId: string, quizType: string): Promise<number>` - Get user multiplier for a quiz type
- `addEarnedCredits(userId: string, amount: number): Promise<void>` - Add earned credits to a user
- `getEarnedCredits(userId: string): Promise<number>` - Get earned credits for a user
- `addClaimedCredits(userId: string, amount: number): Promise<void>` - Add claimed credits to a user
- `getClaimedCredits(userId: string): Promise<number>` - Get claimed credits for a user
- `getAllUsers(): Promise<User[]>` - Get all users

### DatabaseService Class

The DatabaseService class handles:
- Switching between in-memory and PostgreSQL backends based on environment
- Data validation and error handling
- Migration support for database schema changes
- Helper methods for database operations

## Implementation Details

### Database Types
- **In-memory database**: Used for local development and testing (singleton pattern)
- **PostgreSQL**: Used for production deployment (Vercel Postgres)

### Data Models
The database service manages several key entities:
- Users (`users` table): Stores user information including username, password hash, and credit balances
- Session scores (`session_scores` table): Stores quiz session results with scores and multipliers
- User multipliers (`user_multipliers` table): Stores user-specific multipliers for different quiz types
- Credit data: Tracks earned and claimed credits for each user

### Database Initialization
- For PostgreSQL: Creates necessary tables and handles migrations
- For in-memory: Uses singleton pattern to maintain state during development

### Security Considerations
- Uses bcrypt for password hashing
- Implements proper database connection management
- Handles errors gracefully without exposing sensitive information
- Supports database schema migrations

## Environment Configuration

The database service automatically selects the appropriate backend based on environment variables:
- `POSTGRES_URL`: If set, uses PostgreSQL (Vercel)
- Otherwise, uses in-memory database for local development

## Data Validation

All database operations include input validation to ensure data integrity:
- User creation validates uniqueness of username and ID
- Session scores include proper validation of scores and multipliers
- Credit operations validate that claimed credits don't exceed earned credits