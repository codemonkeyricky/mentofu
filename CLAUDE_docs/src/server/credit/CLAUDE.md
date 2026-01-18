# Credit Service API Documentation

This document describes the API endpoints and interfaces for managing user credits in the application.

## Overview

The credit service provides endpoints for managing earned and claimed credits for users. It allows users to track their earned credits, claim credits, and for administrators to modify user credits.

## API Endpoints

### Get Total Earned Credits
- **GET `/credit/earned`** - Get the total earned credits for the authenticated user
  - Response: `{ "earned": number }`

### Add to Earned Credits
- **POST `/credit/earned`** - Add to the user's earned credits
  - Request body: `{ "amount": number }`
  - Response: `{ "message": "Earned credits added successfully", "amount": number, "totalEarned": number }`

### Get Total Claimed Credits
- **GET `/credit/claimed`** - Get the total claimed credits for the authenticated user
  - Response: `{ "claimed": number }`

### Add to Claimed Credits
- **POST `/credit/claimed`** - Add to the user's claimed credits
  - Request body: `{ "amount": number }`
  - Response: `{ "message": "Claimed credits added successfully", "amount": number, "totalClaimed": number, "totalEarned": number }`

## Interface Description

The credit service exposes the following interface:

### CreditService Class

#### Methods:
- `getTotalEarned(userId: string): Promise<number>` - Get total earned credits for a user
- `addEarnedCredits(userId: string, amount: number): Promise<void>` - Add earned credits to a user
- `getTotalClaimed(userId: string): Promise<number>` - Get total claimed credits for a user
- `addClaimedCredits(userId: string, amount: number): Promise<void>` - Add claimed credits to a user

### Controllers
The credit service is exposed via the `creditRouter` which provides REST endpoints for:
- GET `/credit/earned` - Get earned credits
- POST `/credit/earned` - Add to earned credits
- GET `/credit/claimed` - Get claimed credits
- POST `/credit/claimed` - Add to claimed credits

All endpoints require authentication via the `authenticate` middleware.

## Implementation Details

- Credit management is handled through the DatabaseService
- The system tracks both earned and claimed credits separately
- Claimed credits cannot exceed earned credits
- Credits are stored in the database (SQLite for local dev, PostgreSQL for deployment)
- The service uses a dependency injection pattern with the database service

## Data Structures

### UserCredits Interface
- `earned`: number - Total credits earned by the user
- `claimed`: number - Total credits claimed by the user

## Security Considerations

All endpoints require authentication. The credit service does not directly handle user authentication but relies on the authentication middleware for access control.