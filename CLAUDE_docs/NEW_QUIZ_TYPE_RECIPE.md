# Recipe for Adding a New Quiz Type - End-to-End Implementation

## Overview
This recipe provides a step-by-step guide to add a new quiz type to the Mentofu platform, following the established patterns in the codebase.

## Prerequisites
- Understanding of existing quiz types (math, division, fractions, etc.)
- Knowledge of JavaScript/TypeScript implementation
- Basic understanding of REST API endpoints
- Familiarity with the codebase structure

## Step-by-Step Implementation

### 1. Define the New Quiz Type
First, decide on the quiz type name and functionality:
- Choose a unique identifier (e.g., "geometry-quiz", "algebra-quiz")
- Determine the question format and answer type
- Define the quiz's purpose and educational value

### 2. Update Server-Side Components

#### A. Add API Endpoint Registration
In the server session module, add the new quiz type to the supported quiz types list.

#### B. Implement Question Generation
Update `src/server/utils/question.generator.ts` to include:
- New question generation logic for your quiz type
- Answer validation for the new question format
- Support for the new question type in the generateQuestion method

#### C. Create Question Data Structures
Add new question data structure definitions for your quiz type in the session API documentation.

### 3. Implement Client-Side Quiz Module

#### A. Create New Quiz Module File
Create a new JavaScript file in `src/client/public/js/modules/` (or appropriate location):
- File name: `new-quiz-type.js`
- Extend from `quiz-base.js` to inherit common functionality
- Implement quiz-specific logic

#### B. Implement Quiz Logic
Include:
- Question rendering for your quiz type
- Answer submission handling
- Score calculation specific to your quiz type
- Error handling and validation

### 4. Update Client-Side Navigation

#### A. Add Quiz Type to Available Quizzes
Update the client-side quiz selection to include your new quiz type.

#### B. Implement Routing
Ensure the client can navigate to and from the new quiz type.

### 5. Integration with Existing Systems

#### A. Multiplier Management
Ensure new quiz type supports the existing multiplier system for scoring.

#### B. Session Management
Verify the new quiz type integrates with session creation and scoring endpoints.

### 6. Testing

#### A. Unit Tests
- Test question generation for new quiz type
- Test answer validation
- Test session creation and scoring

#### B. Integration Tests
- Test end-to-end flow from session creation to score submission
- Verify API communication works correctly
- Test client-side integration

## Implementation Patterns Based on Existing Code

### API Endpoint Pattern
New endpoints should follow the pattern:
- `GET /session/:quizType` - Creates new session
- `POST /session/:quizType` - Submits answers and returns score

### Quiz Module Pattern
The new quiz module should:
1. Extend from `quiz-base.js`
2. Override required methods for question rendering
3. Implement answer submission handlers
4. Support the same UI patterns as existing quizzes

### Question Generation Pattern
In `question.generator.ts`:
1. Add new case for quiz type
2. Implement question generation logic
3. Include answer validation
4. Support for appropriate question formats

## Example Implementation Structure

### Server-Side (Node.js/TypeScript)
```javascript
// In question.generator.ts
generateQuestion(quizType) {
  switch(quizType) {
    case 'new-quiz-type':
      return this.generateNewQuizQuestion();
    // ... other cases
  }
}

// New method for your quiz type
generateNewQuizQuestion() {
  // Implementation for generating questions
  return {
    question: "What is the area of a circle with radius 5?",
    answer: 78.54
  };
}
```

### Client-Side (JavaScript)
```javascript
// In new-quiz-type.js
class NewQuizType extends QuizBase {
  constructor() {
    super();
    this.quizType = 'new-quiz-type';
  }

  renderQuestion(questionData) {
    // Custom rendering for your quiz type
    return `<div class="question">${questionData.question}</div>`;
  }

  submitAnswer(answer) {
    // Custom answer submission logic
    return super.submitAnswer(answer);
  }
}
```

## Key Considerations

### Consistency
- Follow the same naming conventions as existing quiz types
- Maintain the same data structures for compatibility
- Use consistent error handling patterns

### Performance
- Optimize question generation for performance
- Ensure client-side rendering is efficient
- Consider caching for repeated questions

### Security
- Validate all input on both client and server
- Implement proper authentication checks
- Sanitize all user inputs

## Verification Steps

1. **API Testing**: Test all endpoints for the new quiz type
2. **Client Integration**: Verify client can render and submit quiz
3. **Session Management**: Test session creation, submission, and scoring
4. **Multiplier Integration**: Ensure multipliers work correctly
5. **Database Integration**: Verify scores are properly stored
6. **UI Consistency**: Check that UI matches existing quiz types

## Common Issues and Solutions

1. **Endpoint Not Found**: Ensure the new quiz type is registered in server routes
2. **Question Format Mismatch**: Verify client and server question formats match
3. **Missing Dependencies**: Confirm all required modules are imported
4. **Session Timeout**: Test session creation and cleanup behavior

## Deployment Considerations

1. Update documentation to include the new quiz type
2. Verify all tests pass
3. Test with existing user data
4. Monitor for performance impacts