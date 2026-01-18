# Session API Documentation

This document describes the API endpoints for managing quiz sessions in the application.

## Overview

The session API provides endpoints for creating quiz sessions, submitting answers, retrieving scores, and managing user multipliers. All endpoints require authentication.

## API Endpoints

### Create Quiz Sessions
- **GET `/session/:quizType`** - Creates a new quiz session for the specified quiz type

Supported quiz types:
- `simple-math` (basic arithmetic)
- `simple-math-2` (division questions)
- `simple-math-3` (fraction comparison)
- `simple-math-4` (BODMAS questions)
- `simple-math-5` (factors questions)
- `lcd` (lowest common denominator)
- `simple-words` (word-based quiz)

### Submit Quiz Answers
- **POST `/session/:quizType`** - Validates quiz answers and returns score
  - Request body: `{ "sessionId": "string", "answers": [] }`
  - Returns: `{ "score": number, "total": number }`

### Retrieve Session Scores
- **GET `/session/scores/:sessionId`** - Get score for a specific session
- **GET `/session/scores`** - Get all scores for current user's sessions

### Retrieve All User Sessions
- **GET `/session/all`** - Get all sessions for current user

### Multiplier Management
- **GET `/session/multiplier/:quizType`** - Get user multiplier for a specific quiz type
- **POST `/session/multiplier/:quizType`** - Set user multiplier for a specific quiz type
  - Request body: `{ "multiplier": number }`

## Data Structures

### Session Types

#### Math Session (`Session`)
- `id`: string
- `userId`: string
- `questions`: Question[] (array of MathQuestion, FractionComparisonQuestion, or FactorsQuestion)
- `createdAt`: Date
- `updatedAt`: Date

#### Simple Words Session (`SimpleWordsSession`)
- `id`: string
- `userId`: string
- `words`: SimpleWords[] (array of word objects with word, hint, and letterCount)
- `createdAt`: Date
- `updatedAt`: Date

### Question Types

#### MathQuestion
- `question`: string (e.g., "5*6")
- `answer`: number (e.g., 30)

#### FractionComparisonQuestion
- `question`: [FractionPair, FractionPair]
- `answer`: string ("<", ">", or "=")

#### FactorsQuestion
- `question`: string (e.g., "List all factors of 12")
- `answer`: number (first factor for server-side validation)
- `factors`: number[] (all factors for client-side validation)

#### SimpleWords
- `word`: string
- `hint`: string
- `letterCount`: number

## Implementation Details

### Session Management
- Sessions are stored in-memory with automatic cleanup after 10 minutes
- Both math and simple words sessions are supported
- Sessions include automatic timeout handling with cleanup

### Database Integration
- Session scores are persisted to database (SQLite for local dev, PostgreSQL for deployment)
- Database service handles score storage, retrieval, and multiplier management
- Session scores include weighted scores based on multipliers

### Authentication
- All session endpoints require authentication via `authenticate` middleware
- Sessions are tied to specific user IDs for security

### Multiplier System
- Users can set multipliers for different quiz types (`math` or `simple_words`)
- Multipliers affect score calculation and are stored in the database
- Default multiplier is 1.0