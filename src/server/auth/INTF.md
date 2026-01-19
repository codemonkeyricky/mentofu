# Authentication API Interface

This document describes the API endpoints provided by the authentication module.

## Endpoints

### POST /auth/register
Registers a new user in the system.

#### Request Format
```json
{
  "username": "string",
  "password": "string",
  "isParent": "boolean" (optional)
}
```

#### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | The unique username for the new user |
| password | string | Yes | The password for the new user |
| isParent | boolean | No | Indicates if the user is a parent (default: false) |

#### Response Format (Success - 201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string"
  }
}
```

#### Response Format (Error)
```json
{
  "error": {
    "message": "string",
    "code": "string"
  }
}
```

#### Error Codes
| Code | Message | Status |
|------|---------|--------|
| MISSING_CREDENTIALS | Username and password are required | 400 |
| USERNAME_TAKEN | Username already taken | 409 |
| USER_REGISTRATION_FAILED | Failed to register user | 500 |

---

### POST /auth/login
Authenticates a user and returns a JWT token.

#### Request Format
```json
{
  "username": "string",
  "password": "string"
}
```

#### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | The username of the user |
| password | string | Yes | The password of the user |

#### Response Format (Success - 200 OK)
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

#### Response Format (Error)
```json
{
  "error": {
    "message": "string",
    "code": "string"
  }
}
```

#### Error Codes
| Code | Message | Status |
|------|---------|--------|
| MISSING_CREDENTIALS | Username and password are required | 400 |
| INVALID_CREDENTIALS | Invalid username or password | 401 |
| USER_LOGIN_FAILED | Failed to login user | 500 |