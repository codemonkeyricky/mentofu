# Utility Functions API Documentation

This document describes the utility functions used throughout the application.

## Overview

The utils directory contains helper functions and utilities that provide common functionality used across the application. These utilities help with data generation, formatting, and other repetitive tasks.

## Utility Functions

### UUID Generation
- **File**: `src/server/utils/uuid.ts`
- **Purpose**: Generate UUIDs for various identifiers
- **Implementation**: Uses standard UUID generation algorithm

### Question Generation
- **File**: `src/server/utils/question.generator.ts`
- **Purpose**: Generate math questions for different quiz types
- **Supported Types**:
  - Basic arithmetic (multiplication, division)
  - Fraction comparison
  - BODMAS (order of operations)
  - Factors questions

### Simple Words Generation
- **File**: `src/server/utils/simple.words.generator.ts`
- **Purpose**: Generate word-based questions for the simple-words quiz
- **Features**: Generates words with hints and letter counts

## Implementation Details

### Question Generation
The question generator provides methods for:
- Generating random math questions
- Validating question answers
- Supporting multiple question types
- Handling edge cases and invalid inputs

### Word Generation
The simple words generator provides:
- Word selection with hints
- Letter count calculation
- Word validation
- Randomization of word selection

### UUID Generation
- Generates RFC4122 compliant UUIDs
- Used for session IDs and other identifiers
- Consistent format across the application

## Usage Examples

```typescript
// Generate a math question
const question = questionGenerator.generateMathQuestion('simple-math');
// Returns: { question: "5*6", answer: 30 }

// Generate a word question
const wordQuestion = simpleWordsGenerator.generateWordQuestion();
// Returns: { word: "example", hint: "A sample word", letterCount: 7 }

// Generate UUID
const sessionId = generateUUID();
// Returns: "550e8400-e29b-41d4-a716-446655440000"
```

## Integration

Utility functions are integrated into:
- Session service for question generation
- Test suite for mock data generation
- Various controllers for data processing

## Security Considerations

- All utilities are deterministic for testing purposes
- Randomization is handled appropriately for security
- No sensitive data is exposed through utilities
- Functions are designed for performance and reliability

## Testing

Each utility function includes:
- Unit tests for core functionality
- Edge case testing
- Performance testing where relevant
- Integration testing with service layers