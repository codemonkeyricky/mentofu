# Recipe: Creating a New Quiz Type

This recipe explains how to add a new quiz type to the application, following the pattern established by the LCD quiz implementation.

## Overview

The application supports multiple quiz types. To add a new quiz, you need to update frontend components, backend routes, and question generation logic.

## 1. Frontend Components

### 1.1 Quiz Card UI
Add the quiz card to `src/client/index.html`:

```html
<div class="quiz-card" data-quiz-type="your-quiz-type">
    <div class="quiz-icon">
        <i class="fas fa-icon-name"></i>
    </div>
    <div class="quiz-info">
        <h4>Your Quiz Title</h4>
        <p>Description</p>
    </div>
    <div class="multiplier-badge" data-multiplier="1">x1</div>
    <button class="btn btn-outline start-quiz-btn">Start</button>
</div>
```

### 1.2 Quiz Module
Create a new JavaScript module in `src/client/modules/your-quiz.js`:

```javascript
import QuizBase from './quiz-base.js';

export default class YourQuiz extends QuizBase {
    constructor(mathMasterPro) {
        super(mathMasterPro);
        this.currentQuestions = [];
    }

    async startQuiz() {
        // Validate authentication
        if (!this.mathMasterPro.currentToken) {
            this.mathMasterPro.showNotification('Please log in to access quizzes.', 'warning');
            this.mathMasterPro.showScreen('auth');
            return;
        }

        // Reset buttons
        this.resetAllButtons();

        // Show loading state
        const button = this.mathMasterPro.startMathBtn;
        if (button) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Loading...`;
        }

        this.currentQuizType = 'your-quiz-type';

        // Fetch session from API
        const response = await fetch(`/session/your-quiz-type`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.mathMasterPro.currentToken}`
            }
        });

        const data = await response.json();
        this.currentSessionId = data.sessionId;
        this.currentQuestions = data.questions;
        this.currentUserAnswers = new Array(this.currentQuestions.length).fill(null);

        // Show quiz screen
        this.mathMasterPro.showScreen('quiz');
        this.mathMasterPro.screens.quiz.classList.add('slide-in');

        // Render questions
        setTimeout(() => {
            this.renderQuestions();
        }, 300);
    }

    async submitAnswers() {
        // Validate all questions answered
        let hasUnanswered = this.currentUserAnswers.some(answer => answer === '' || answer === null);

        if (hasUnanswered) {
            this.mathMasterPro.showNotification('Please answer all questions before submitting.', 'warning');
            return;
        }

        // Show loading state
        const button = this.mathMasterPro.submitBtn;
        if (button) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processing...`;
        }

        // Submit to API
        const response = await fetch(`/session/your-quiz-type`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.mathMasterPro.currentToken}`
            },
            body: JSON.stringify({
                sessionId: this.currentSessionId,
                answers: this.currentUserAnswers
            })
        });

        const result = await response.json();
        this.displayResults(result.score, result.total, result.details);
    }

    renderQuestions() {
        this.mathMasterPro.questionsContainer.innerHTML = '';

        this.currentQuestions.forEach((question, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card animate__animated animate__fadeIn';
            questionCard.style.animationDelay = `${index * 0.1}s`;

            questionCard.innerHTML = `
                <div class="question-container-compact">
                    <div class="question-info">
                        <span class="badge bg-primary me-2">Q${index + 1}</span>
                        <span class="question-text-main">${question.question}</span>
                    </div>
                    <div class="answer-wrapper">
                        <input type="number"
                               class="form-control answer-input"
                               id="answer-${index}"
                               placeholder="Answer"
                               min="0"
                               max="999"
                               step="0.01"
                               data-index="${index}">
                    </div>
                </div>
            `;

            this.mathMasterPro.questionsContainer.appendChild(questionCard);
        });

        document.querySelectorAll('.answer-input').forEach(input => {
            input.addEventListener('input', (event) => this.handleAnswerInput(event));
            input.addEventListener('change', (event) => this.validateAnswerInput(event));
        });
    }
}
```

### 1.3 Quiz Manager Integration
Update `src/client/modules/quiz-manager.js`:

```javascript
import YourQuiz from './your-quiz.js';

export default class QuizManager {
    constructor(mathMasterPro) {
        this.mathMasterPro = mathMasterPro;
        this.bodmasQuiz = new BODMASQuiz(mathMasterPro);
        this.spellingQuiz = new SpellingQuiz(mathMasterPro);
        this.factorsQuiz = new FactorsQuiz(mathMasterPro);
        this.yourQuiz = new YourQuiz(mathMasterPro); // Add new quiz instance
    }

    async startQuiz(quizType) {
        switch (quizType) {
            case 'your-quiz-type':
                return await this.yourQuiz.startQuiz();
            // Add other cases...
        }
    }

    async submitAnswers() {
        switch (this.currentQuizType) {
            case 'your-quiz-type':
                return await this.yourQuiz.submitAnswers();
            // Add other cases...
        }
    }
}
```

### 1.4 Button Configuration
Update `src/client/modules/quiz-base.js`:

```javascript
const buttonConfigs = {
    'your-quiz-type': { icon: 'fa-icon-name', text: 'Start Your Quiz' },
    // Add other button configs...
};

const buttonConfigsWithBtns = [
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-icon-name', text: 'Start Your Quiz' },
    // Add other buttons...
];
```

### 1.5 Main Application Updates
Update `src/client/main.js`:

```javascript
// Add to quiz names map
const quizNames = {
    'your-quiz-type': 'Your Quiz Name',
    // Add other quiz names...
};

// Add to fetch multiplier calls
this.fetchMultiplier('your-quiz-type'),

// Update updateQuizCardBadges method
const [simpleMath1, simpleMath2, simpleMath3, simpleMath4, simpleMath5, simpleMath6, simpleWords, additionTest, yourQuiz] = multipliers;

// Add multiplier assignments
const roundedSimpleMath6 = Math.round(simpleMath6);
const roundedAdditionTest = Math.round(additionTest);

// Add multiplier assignment
else if (quizType === 'your-quiz-type') {
    multiplier = yourQuiz;
} else if (quizType === 'addition-test') {
    multiplier = roundedAdditionTest;
}
```

### 1.6 Parent Dashboard
Update `src/client/components/ParentDashboard.tsx`:

```typescript
const quizTypeNames = {
    // ... existing quiz types
    'your-quiz-type': 'Your Quiz Name',
};

// Add to multiplier fetching
const [simpleMath1, simpleMath2, simpleMath3, simpleMath4, simpleMath5, simpleMath6, simpleWords, yourQuiz] = multipliers;
```

## 2. Backend Components

### 2.1 Question Generator
Add question generation function in `src/server/utils/question.generator.ts`:

```typescript
export function generateYourQuizQuestions(count: number = 10): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        // Generate questions based on your logic
        const question = `Your question text`;
        const answer = yourAnswerValue;

        questions.push({
            question,
            answer
        });
    }

    return questions;
}
```

### 2.2 Session Controller Routes
Add routes in `src/server/session/session.controller.ts`:

```typescript
const quizTypes = [
    // ... existing quiz types
    'your-quiz-type',
    'addition-test'
];
const quizTypePattern = `:quizType(${quizTypes.join('|')})`;

// GET /session/your-quiz-type - Create quiz session
sessionRouter.get('/your-quiz-type', authenticate, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const session = await sessionService.createQuizSession(user.userId, 'your-quiz-type');

        if ('words' in session) {
            res.status(200).json({
                sessionId: session.id,
                words: (session as SimpleWordsSession).words
            });
        } else {
            res.status(200).json({
                sessionId: session.id,
                questions: (session as Session).questions
            });
        }
    } catch (error) {
        console.error('Error creating your quiz session:', error);
        res.status(500).json({
            error: {
                message: 'Failed to create your quiz session'
            }
        });
    }
});

// POST /session/your-quiz-type - Validate quiz answers
sessionRouter.post('/your-quiz-type', authenticate, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { sessionId, answers } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                error: { message: 'Session ID is required', code: 'MISSING_SESSION_ID' }
            });
        }

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                error: { message: 'Answers array is required', code: 'MISSING_ANSWERS' }
            });
        }

        const result = await sessionService.validateQuizAnswers(
            sessionId,
            user.userId,
            answers,
            'your-quiz-type'
        );

        res.status(200).json({
            score: result.score,
            total: result.total
        });
    } catch (error: any) {
        // Handle errors
        res.status(500).json({
            error: {
                message: 'Failed to process quiz answers'
            }
        });
    }
});

// GET /session/addition-test - Create addition test session
sessionRouter.get('/addition-test', authenticate, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const session = await sessionService.createQuizSession(user.userId, 'addition-test');

        if ('words' in session) {
            res.status(200).json({
                sessionId: session.id,
                words: (session as SimpleWordsSession).words
            });
        } else {
            res.status(200).json({
                sessionId: session.id,
                questions: (session as Session).questions
            });
        }
    } catch (error) {
        console.error('Error creating addition test session:', error);
        res.status(500).json({
            error: {
                message: 'Failed to create addition test session'
            }
        });
    }
});

// POST /session/addition-test - Validate addition test answers
sessionRouter.post('/addition-test', authenticate, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { sessionId, answers } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                error: { message: 'Session ID is required', code: 'MISSING_SESSION_ID' }
            });
        }

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                error: { message: 'Answers array is required', code: 'MISSING_ANSWERS' }
            });
        }

        const result = await sessionService.validateQuizAnswers(
            sessionId,
            user.userId,
            answers,
            'addition-test'
        );

        res.status(200).json({
            score: result.score,
            total: result.total
        });
    } catch (error: any) {
        // Handle errors
        res.status(500).json({
            error: {
                message: 'Failed to process addition test answers'
            }
        });
    }
});
```

### 2.3 Session Service
Update `src/server/session/session.service.impl.ts`:

```typescript
import { generateYourQuizQuestions } from '../utils/question.generator';

const questionGenerators: Record<string, (count: number) => Question[]> = {
    // ... existing generators
    'your-quiz-type': generateYourQuizQuestions,
};

// Add to math validation configs
const mathValidationConfigs: Record<string, MathValidationConfig> = {
    // ... existing configs
    'your-quiz-type': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => String(ua) === String(q.answer),
    },
};

// Update question generation in createQuizSession
const questions = generator(
    quizType === 'your-quiz-type' || quizType === 'simple-math-6' ? 5 : 10
);
```

### 2.4 Parent Controller
Update `src/server/parent/parent.controller.impl.ts`:

```typescript
const _VALID_QUIZ_TYPES = [
    'simple-math',
    'simple-math-2',
    'simple-math-3',
    'simple-math-4',
    'simple-math-5',
    'simple-math-6',
    'your-quiz-type', // Add new quiz type
    'simple-words',
    'addition-test' // Add new quiz type
];

// Update error message
return res.status(400).json({
    error: {
        message: 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-math-6, simple-words, addition-test',
        code: 'INVALID_QUIZ_TYPE'
    }
});
```

### 2.5 Session Types
Update `src/server/session/session.types.ts`:

```typescript
export interface Question {
    question: string;
    answer: number | string;
    [key: string]: any;
}
```

## 3. Testing Checklist

- [ ] Quiz card displays correctly in the UI
- [ ] Quiz can be started and shows loading state
- [ ] Questions render correctly with proper formatting
- [ ] Answers can be entered and validated
- [ ] Submission shows loading state
- [ ] Results are displayed correctly
- [ ] Quiz can be restarted
- [ ] Multiplier badge updates correctly
- [ ] Parent dashboard shows correct quiz names
- [ ] API routes return proper responses
- [ ] Question generation creates valid questions

## 4. Common Patterns

### Answer Validation
Most quizzes use numeric answers. Update the validation config in `mathValidationConfigs`:

```typescript
'your-quiz-type': {
    isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
    validate: (q, ua) => String(ua) === String(q.answer),
}
```

### Question Generation
For numeric answers, ensure your generator returns proper Question objects:

```typescript
questions.push({
    question: "Your question text",
    answer: expectedAnswerValue
});
```

### Session Management
All quiz types follow the same session lifecycle:
1. GET request creates session and returns questions
2. POST request validates answers and returns score
3. Session is stored in the database
4. Results are calculated and displayed

## 5. Troubleshooting

- **Questions not rendering**: Check console for JavaScript errors
- **Submission failing**: Verify session ID and answers format
- **Authentication errors**: Ensure token is properly set
- **Database errors**: Check session creation logic
- **UI not updating**: Verify button configurations and event listeners
