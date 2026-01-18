# Detailed Guide for Implementing New Quiz Types

## File Structure Overview

Based on the CLAUDE.md documentation, the project has the following structure:

### Server Components:
- `src/server/session/` - API endpoints for quiz sessions
- `src/server/utils/` - Question generation and utility functions
- `src/server/database/` - Database integration
- `src/server/types/` - Type definitions

### Client Components:
- `src/client/` - Frontend implementation
- `src/client/public/js/modules/` - Quiz modules (not visible in current structure)

## Step-by-Step Implementation Guide

### Step 1: Define Your New Quiz Type

First, decide on:
- Quiz type name: e.g., "algebra-quiz", "geometry-quiz"
- Question format: e.g., algebraic equations, geometric problems
- Answer format: e.g., numeric, text, multiple choice

### Step 2: Update Server-Side Question Generation

1. **File**: `src/server/utils/question.generator.ts`
2. **Add new case**: Extend the generateQuestion method to handle your quiz type
3. **Create new generation function**: Implement question generation specific to your quiz type

Example implementation pattern:
```typescript
generateQuestion(quizType: string): Question {
  switch(quizType) {
    case 'algebra-quiz':
      return this.generateAlgebraQuestion();
    // existing cases...
  }
}

private generateAlgebraQuestion(): AlgebraQuestion {
  // Generate algebraic equation
  return {
    question: "Solve: 2x + 5 = 15",
    answer: 5
  };
}
```

### Step 3: Update Session API Endpoints

1. **File**: `src/server/session/` (likely in main server file)
2. **Add route handler**: Create handlers for your new quiz type
3. **Update supported quiz types list** in session/CLAUDE.md

### Step 4: Create Client-Side Quiz Module

1. **File**: Create `src/client/public/js/modules/algebra-quiz.js` (or similar)
2. **Extend QuizBase**: Inherit from base quiz class
3. **Implement rendering**: Custom rendering for your question format
4. **Implement submission**: Handle answer submission for your quiz type

### Step 5: Update Client Navigation

1. **Add quiz to available options**: Update client-side quiz selection
2. **Update routing**: Ensure client can navigate to new quiz type
3. **Add UI elements**: Create necessary HTML/CSS for your quiz type

### Step 6: Integration Testing

1. **API Endpoints**: Test session creation and submission
2. **Client Integration**: Verify quiz displays and functions correctly
3. **Database Integration**: Ensure scores are properly stored
4. **Multiplier System**: Verify scoring works with multipliers

## Technical Requirements for Each Quiz Type

### Data Structure Requirements:
- Question objects with question string and answer
- Session objects that store questions and user responses
- Score objects with weighted values

### API Requirements:
- GET `/session/:quizType` endpoint for creating sessions
- POST `/session/:quizType` endpoint for submitting answers
- Support for existing endpoints like `/session/scores` and `/session/multiplier`

### Client Requirements:
- Integration with existing authentication flow
- Consistent UI patterns with other quizzes
- Error handling and validation
- Responsive design for all quiz types

## Code Examples

### Example Question Generation:
```javascript
// In question.generator.ts
generateAlgebraQuestion() {
  // Create a random algebra problem
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const result = a * b;

  return {
    question: `Solve for x: ${a}x = ${result}`,
    answer: b,
    type: 'algebra'
  };
}
```

### Example Client Quiz Module:
```javascript
class AlgebraQuiz extends QuizBase {
  constructor() {
    super();
    this.quizType = 'algebra-quiz';
  }

  renderQuestion(questionData) {
    const container = document.createElement('div');
    container.className = 'algebra-question';
    container.innerHTML = `
      <h3>${questionData.question}</h3>
      <input type="number" id="answer-input" placeholder="Enter answer">
      <button onclick="this.submitAnswer()">Submit</button>
    `;
    return container;
  }

  submitAnswer(answer) {
    // Custom answer validation
    return this.validateAnswer(answer);
  }
}
```

## Best Practices

1. **Follow Existing Patterns**: Use the same structure and naming conventions
2. **Consistent Error Handling**: Implement error handling consistent with other quizzes
3. **Performance Considerations**: Optimize question generation and rendering
4. **Security**: Always validate inputs on both client and server
5. **Testing**: Write tests for your new quiz type
6. **Documentation**: Update documentation to reflect new quiz type

## Testing Strategy

1. **Unit Tests**: Test question generation functions
2. **Integration Tests**: Test API endpoints with various inputs
3. **UI Tests**: Verify client-side rendering and behavior
4. **End-to-End Tests**: Test complete workflow from start to finish
5. **Performance Tests**: Ensure no performance degradation

## Troubleshooting

Common issues and solutions:
- **Quiz not appearing**: Check API registration and routing
- **Questions not generating**: Verify question generation logic
- **Submission errors**: Check answer validation and API endpoints
- **Score calculation issues**: Verify multiplier and scoring logic

This guide provides a comprehensive approach to adding new quiz types while maintaining consistency with existing code patterns and functionality.