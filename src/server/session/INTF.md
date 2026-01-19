# Session API Interface Documentation

## Overview

This document describes the API endpoints for managing quiz sessions in the application. All endpoints require authentication.

## API Endpoints

### Create Quiz Sessions
- **GET `/session/:quizType`** - Creates a new quiz session for the specified quiz type

Supported quiz types:
- `simple-math` (basic arithmetic)
- `simple-math-2` (division questions)
- `simple-math-3` (fraction comparison)
- `simple-math-4` (BODMAS questions)
- `simple-math-5` (factors questions)
- `simple-words` (word-based quiz)

**Response Format:**
- For math sessions:
```json
{
  "sessionId": "string",
  "questions": [
    {
      "question": "string",
      "answer": "number"
    }
  ]
}
```
- For simple words sessions:
```json
{
  "sessionId": "string",
  "words": [
    {
      "word": "string",
      "hint": "string",
      "letterCount": "number"
    }
  ]
}
```

### Submit Quiz Answers
- **POST `/session/:quizType`** - Validates quiz answers and returns score
  - Request body: `{ "sessionId": "string", "answers": [] }`
  - Returns: `{ "score": number, "total": number }`

### Retrieve Session Scores
- **GET `/session/scores/:sessionId`** - Get score for a specific session
  - Returns: `{ "sessionId": "string", "score": number, "total": number }`

### Retrieve All Scores for Current User
- **GET `/session/scores`** - Get all scores for current user's sessions
  - Returns: `{ "scores": [] }`

### Retrieve All User Sessions
- **GET `/session/all`** - Get all sessions for current user
  - Returns: `{ "sessions": [] }`

### Multiplier Management
- **GET `/session/multiplier/:quizType`** - Get user multiplier for a specific quiz type
  - Returns: `{ "quizType": "string", "multiplier": number }`

- **POST `/session/multiplier/:quizType`** - Set user multiplier for a specific quiz type
  - Request body: `{ "multiplier": number }`
  - Returns: `{ "quizType": "string", "multiplier": number }`

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

## Implementation Notes

1. Sessions are stored in-memory with automatic TTL (Time To Live) of 10 minutes
2. All endpoints except GET `/session/:quizType` require authentication
3. The quiz type parameter is validated at the router level
4. Session scores are persisted to the database when answers are submitted
5. Multiplier values must be positive numbers
6. Different quiz types have different validation approaches:
   - Math questions: Direct number comparison
   - Fraction comparison: String comparison of "<", ">", or "="
   - Factors questions: Parse comma-separated input and validate against actual factors
   - Simple words: Case-insensitive string comparison
7. Session cleanup is handled automatically via timeouts and a periodic cleanup function

All the endpoints are implemented in the session controller and service files, with appropriate error handling for invalid sessions, unauthorized access, and other potential issues.