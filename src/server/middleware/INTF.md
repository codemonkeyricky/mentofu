# Middleware API Interface Documentation

This document describes the middleware functions used for authentication and authorization in the application.

## Overview

The middleware layer provides essential security and access control for API endpoints. It ensures that only authenticated and authorized users can access protected resources.

## Middleware Functions

### authenticate
- **Purpose**: Authenticates requests using JWT tokens
- **Usage**: Applied to endpoints requiring user authentication
- **Behavior**:
  - Extracts JWT token from Authorization header
  - Verifies token validity
  - Adds user information to request object if authentication succeeds
  - Returns 401 error if token is missing or invalid

### requireAdmin
- **Purpose**: Restricts access to admin-only endpoints
- **Usage**: Applied to endpoints requiring admin privileges
- **Behavior**:
  - First applies the standard authentication middleware
  - Verifies that the authenticated user has admin privileges
  - Returns 403 error if user lacks admin permissions

## API Endpoints

### Authentication Endpoints
- **POST /auth/login**
  - **Description**: Authenticate user and return JWT token
  - **Request**:
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
  - **Response**:
    ```json
    {
      "token": "string",
      "user": {
        "id": "string",
        "username": "string",
        "isParent": "boolean"
      }
    }
    ```

- **POST /auth/register**
  - **Description**: Register a new user
  - **Request**:
    ```json
    {
      "username": "string",
      "password": "string",
      "isParent": "boolean"
    }
    ```
  - **Response**:
    ```json
    {
      "id": "string",
      "username": "string",
      "isParent": "boolean"
    }
    ```

### Session Endpoints (Protected by authenticate)
- **GET /session/:quizType**
  - **Description**: Start a new quiz session for a specific quiz type
  - **Request**:
    - Header: Authorization Bearer token
  - **Response**:
    ```json
    {
      "sessionId": "string",
      "questions": [
        {
          "id": "string",
          "question": "string",
          "options": ["string"],
          "correctAnswer": "string"
        }
      ]
    }
    ```

- **POST /session/:quizType**
  - **Description**: Submit quiz answers and get score
  - **Request**:
    - Header: Authorization Bearer token
    - Body:
    ```json
    {
      "answers": [
        {
          "questionId": "string",
          "selectedOption": "string"
        }
      ]
    }
    ```
  - **Response**:
    ```json
    {
      "score": "number",
      "totalQuestions": "number",
      "percentage": "number"
    }
    ```

- **GET /session/scores/:sessionId**
  - **Description**: Get score for a specific session
  - **Request**:
    - Header: Authorization Bearer token
  - **Response**:
    ```json
    {
      "score": "number",
      "totalQuestions": "number",
      "percentage": "number"
    }
    ```

- **GET /session/scores**
  - **Description**: Get all scores for current user's sessions
  - **Request**:
    - Header: Authorization Bearer token
  - **Response**:
    ```json
    {
      "scores": [
        {
          "sessionId": "string",
          "quizType": "string",
          "score": "number",
          "totalQuestions": "number",
          "percentage": "number",
          "timestamp": "string"
        }
      ]
    }
    ```

- **GET /session/all**
  - **Description**: Get all sessions for current user
  - **Request**:
    - Header: Authorization Bearer token
  - **Response**:
    ```json
    {
      "sessions": [
        {
          "sessionId": "string",
          "quizType": "string",
          "createdAt": "string",
          "score": "number",
          "totalQuestions": "number",
          "percentage": "number"
        }
      ]
    }
    ```

- **GET /session/multiplier/:quizType**
  - **Description**: Get user multiplier for a specific quiz type
  - **Request**:
    - Header: Authorization Bearer token
  - **Response**:
    ```json
    {
      "multiplier": "number"
    }
    ```

- **POST /session/multiplier/:quizType**
  - **Description**: Set user multiplier for a specific quiz type
  - **Request**:
    - Header: Authorization Bearer token
    - Body:
    ```json
    {
      "multiplier": "number"
    }
    ```
  - **Response**:
    ```json
    {
      "multiplier": "number"
    }
    ```

### Credit Endpoints (Protected by authenticate)
- **GET /credit/earned**
  - **Description**: Get total earned credits
  - **Request**:
    - Header: Authorization Bearer token
  - **Response**:
    ```json
    {
      "totalEarned": "number"
    }
    ```

- **POST /credit/earned**
  - **Description**: Add to earned credits
  - **Request**:
    - Header: Authorization Bearer token
    - Body:
    ```json
    {
      "amount": "number"
    }
    ```
  - **Response**:
    ```json
    {
      "totalEarned": "number"
    }
    ```

- **GET /credit/claimed**
  - **Description**: Get total claimed credits
  - **Request**:
    - Header: Authorization Bearer token
  - **Response**:
    ```json
    {
      "totalClaimed": "number"
    }
    ```

- **POST /credit/claimed**
  - **Description**: Add to claimed credits
  - **Request**:
    - Header: Authorization Bearer token
    - Body:
    ```json
    {
      "amount": "number"
    }
    ```
  - **Response**:
    ```json
    {
      "totalClaimed": "number"
    }
    ```

### Admin Endpoints (Protected by requireAdmin)
- **PATCH /parent/users/:userId/multiplier**
  - **Description**: Update user multiplier for specific quiz types
  - **Request**:
    - Header: Authorization Bearer token (admin required)
    - Path: userId (string)
    - Body:
    ```json
    {
      "multiplier": "number",
      "quizType": "string"
    }
    ```
  - **Response**:
    ```json
    {
      "multiplier": "number"
    }
    ```

- **PATCH /parent/users/:userId/credits**
  - **Description**: Update user credits
  - **Request**:
    - Header: Authorization Bearer token (admin required)
    - Path: userId (string)
    - Body:
    ```json
    {
      "earned": "number",
      "claimed": "number"
    }
    ```
  - **Response**:
    ```json
    {
      "earned": "number",
      "claimed": "number"
    }
    ```

- **GET /parent/users**
  - **Description**: Get list of all users (with their multipliers and credits)
  - **Request**:
    - Header: Authorization Bearer token (admin required)
  - **Response**:
    ```json
    {
      "users": [
        {
          "id": "string",
          "username": "string",
          "isParent": "boolean",
          "multipliers": {
            "math": "number",
            "science": "number"
          },
          "credits": {
            "earned": "number",
            "claimed": "number"
          }
        }
      ]
    }
    ```

- **GET /parent/users/:userId**
  - **Description**: Get specific user details
  - **Request**:
    - Header: Authorization Bearer token (admin required)
    - Path: userId (string)
  - **Response**:
    ```json
    {
      "id": "string",
      "username": "string",
      "isParent": "boolean",
      "multipliers": {
        "math": "number",
        "science": "number"
      },
      "credits": {
        "earned": "number",
        "claimed": "number"
      }
    }
    ```

## Error Response Format

All error responses follow this format:
```json
{
  "error": {
    "message": "string",
    "code": "string"
  }
}
```

### HTTP Status Codes
- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error