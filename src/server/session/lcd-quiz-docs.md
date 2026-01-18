# LCD Quiz API Documentation

## Overview

The LCD (Lowest Common Denominator) quiz is a new quiz type that focuses on teaching students how to calculate the Lowest Common Multiple (LCM) of two numbers. This quiz helps users practice finding the smallest positive integer that is divisible by both numbers.

## API Endpoints

### Create LCD Quiz Session
- **GET `/session/lcd`** - Creates a new LCD quiz session
  - Returns: `{ "sessionId": string, "questions": Question[] }`
  - Questions are objects with properties: `{ "question": string, "answer": number }`

### Submit LCD Quiz Answers
- **POST `/session/lcd`** - Validates LCD quiz answers and returns score
  - Request body: `{ "sessionId": string, "answers": number[] }`
  - Returns: `{ "score": number, "total": number }`

## Question Format

Each LCD question follows this format:
- Question: "Find the lowest common multiple (LCM) of X and Y"
- Answer: The calculated LCM value

Example question: "Find the lowest common multiple (LCM) of 6 and 8"
Example answer: 24

## Implementation Details

### Question Generation
The LCD quiz uses the `generateLCDQuestions` function in `src/server/utils/question.generator.ts`:
- Generates 10 questions by default
- Uses two random numbers between 2 and 20
- Calculates LCM using the formula: LCM(a,b) = (a * b) / GCD(a,b)
- Uses the Euclidean algorithm to calculate GCD

### Validation
The LCD quiz uses the same validation logic as other math quizzes:
- Answers are compared numerically
- Session validation uses the `validateAnswers` method from `session.service.ts`
- Session ownership is verified for security

## Integration

The LCD quiz integrates seamlessly with:
- Session management system (creation, validation, cleanup)
- Database for score tracking
- Credit system (scores affect earned credits)
- Multiplier system (scores are weighted by multipliers)
- Parent/admin functionality (can be managed by admins)

## Usage Examples

### Creating a session
```http
GET /session/lcd
Authorization: Bearer <JWT_TOKEN>
```

### Submitting answers
```http
POST /session/lcd
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "sessionId": "session-id-here",
  "answers": [24, 15, 35, 42, 12, 20, 18, 27, 30, 36]
}
```

## Security Considerations

- All endpoints require authentication
- Session ownership is verified before answer validation
- Sessions are automatically cleaned up after 10 minutes
- Session IDs are UUIDs for uniqueness and security