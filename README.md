# Quiz API

A REST API for a multiplication quiz session application built with TypeScript and Express.

## Description

This API provides endpoints for managing multiplication quiz sessions. Users can retrieve quiz questions and submit answers to be scored.

## Features

- Generate multiplication quiz sessions with 10 single-digit multiplication questions
- Submit answers for scoring
- Session-based quiz management
- RESTful API design

## Endpoints

### GET /session
Retrieve a new quiz session with 10 multiplication questions.

**Response:**
```json
{
  "sessionId": "uuid-string",
  "questions": [
    {
      "id": 1,
      "question": "2*8",
      "answer": 16
    },
    ...
  ]
}
```

### POST /session
Submit answers for a quiz session and receive scoring results.

**Request Body:**
```json
{
  "sessionId": "uuid-string",
  "answers": [
    {
      "questionId": 1,
      "answer": 16
    },
    ...
  ]
}
```

**Response:**
```json
{
  "sessionId": "uuid-string",
  "score": 8,
  "totalQuestions": 10
}
```

## Technologies Used

- **TypeScript**: Strongly typed JavaScript for better code quality
- **Express**: Web framework for Node.js
- **Better SQLite3**: Database for storing session data
- **JWT**: JSON Web Token for authentication
- **Jest**: Testing framework
- **Cypress**: End-to-end testing
- **Swagger**: API documentation

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Testing

Run unit tests:
```bash
npm test
```

Run end-to-end tests:
```bash
npm run cypress:open
```

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## Project Structure

- `src/` - Source code directory
  - `auth/` - Authentication related files
  - `session/` - Session management and quiz functionality
  - `database/` - Database service
  - `middleware/` - Express middleware
  - `utils/` - Utility functions
  - `test/` - Test files
- `dist/` - Compiled JavaScript output (generated during build)
- `spec.md` - Project specification

