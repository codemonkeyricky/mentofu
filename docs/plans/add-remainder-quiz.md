# Implementation Plan: Remainder Quiz

## Overview
Add a new quiz type that generates division problems and asks users to find the remainder.

**Requirements:**
- Generate 5 questions per session
- Divisors: 2-12 (mixed)
- Answers: Remainder values (single digit)
- Example: 43 ÷ 8 = 5 remainder 3 → answer: "3"

---

## Backend Implementation

### 1. Create Question Generator
**File:** `src/server/utils/rem-remainder.generator.ts`

```typescript
import { Question } from '../session/session.types';

export function generateRemRdQuestions(count: number = 5): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const divisor = Math.floor(Math.random() * 11) + 2; // 2-12
        const dividend = Math.floor(Math.random() * 100) + 1; // 1-100
        const quotient = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;

        questions.push({
            question: `${dividend} ÷ ${divisor}`,
            answer: remainder
        });
    }

    return questions;
}
```

### 2. Update Session Service
**File:** `src/server/session/session.service.impl.ts`

**Add to imports:**
```typescript
import { generateRemRdQuestions } from '../utils/rem-remainder.generator';
```

**Add to questionGenerators mapping (line ~20):**
```typescript
const questionGenerators: Record<string, (count: number) => Question[]> = {
    'simple-math': generateQuestions,
    'simple-math-2': generateDivisionQuestions,
    'simple-math-3': generateFractionComparisonQuestions,
    'simple-math-4': generateBODMASQuestions,
    'simple-math-5': generateFactorsQuestions,
    'simple-math-6': generateLCDQuestions,
    'simple-remainder': generateRemRdQuestions,
    'addition-test': generateAdditionTestQuestions,
    'simple-words': generateSimpleWords
};
```

**Add validation config (line ~30):**
```typescript
const mathValidationConfigs: Record<string, MathValidationConfig> = {
    'simple-math': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswer = String(ua).trim();
            const correctAnswer = String(q.answer);
            return userAnswer === correctAnswer;
        }
    },
    'simple-math-2': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswer = String(ua).trim();
            const correctAnswer = String(q.answer);
            return userAnswer === correctAnswer;
        }
    },
    'simple-math-3': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswer = String(ua).trim();
            const correctAnswer = String(q.answer);
            return userAnswer === correctAnswer;
        }
    },
    'simple-math-4': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswer = String(ua).trim();
            const correctAnswer = String(q.answer);
            return userAnswer === correctAnswer;
        }
    },
    'simple-math-5': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswers = Array.isArray(ua) ? ua.map(a => String(a).trim()) : [String(ua).trim()];
            const correctAnswers = Array.isArray(q.answer) ? q.answer.map(a => String(a).trim()) : [String(q.answer).trim()];
            return userAnswers.length === correctAnswers.length &&
                   userAnswers.every((ua, i) => ua === correctAnswers[i]);
        }
    },
    'simple-math-6': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswer = String(ua).trim();
            const correctAnswer = String(q.answer);
            return userAnswer === correctAnswer;
        }
    },
    'simple-remainder': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswer = String(ua).trim();
            const correctAnswer = String(q.answer);
            return userAnswer === correctAnswer;
        }
    },
    'addition-test': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswer = String(ua).trim();
            const correctAnswer = String(q.answer);
            return userAnswer === correctAnswer;
        }
    },
    'simple-words': {
        isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
        validate: (q, ua) => {
            const userAnswer = String(ua).trim().toLowerCase();
            const correctAnswer = String(q.answer).toLowerCase();
            return userAnswer === correctAnswer;
        }
    }
};
```

**Update question generation (line ~190):**
```typescript
const questions = generator(
    quizType === 'simple-remainder' || quizType === 'simple-math-5' || quizType === 'simple-math-6' ? 5 : 10
);
```

### 3. Update Session Controller
**File:** `src/server/session/session.controller.ts`

**Add to quizTypes array (line ~15):**
```typescript
const quizTypes = [
    'simple-math',
    'simple-math-2',
    'simple-math-3',
    'simple-math-4',
    'simple-math-5',
    'simple-math-6',
    'simple-remainder',
    'simple-words',
    'addition-test'
];
const quizTypePattern = `:quizType(${quizTypes.join('|')})`;
```

**Add GET route (after LCD route, line ~80):**
```typescript
sessionRouter.get('/simple-remainder', authenticate, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const session = await sessionService.createQuizSession(user.userId, 'simple-remainder');

        res.status(200).json({
            sessionId: session.id,
            questions: (session as Session).questions
        });
    } catch (error) {
        console.error('Error creating remainder quiz session:', error);
        res.status(500).json({
            error: {
                message: 'Failed to create remainder quiz session'
            }
        });
    }
});
```

**Add POST route (after LCD route, line ~100):**
```typescript
sessionRouter.post('/simple-remainder', authenticate, async (req: Request, res: Response) => {
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
            'simple-remainder'
        );

        res.status(200).json({
            score: result.score,
            total: result.total
        });
    } catch (error: any) {
        console.error('Error processing remainder quiz answers:', error);
        res.status(500).json({
            error: {
                message: 'Failed to process remainder quiz answers'
            }
        });
    }
});
```

### 4. Update Parent Controller
**File:** `src/server/parent/parent.controller.impl.ts`

**Add to _VALID_QUIZ_TYPES (line ~15):**
```typescript
const _VALID_QUIZ_TYPES = [
    'simple-math',
    'simple-math-2',
    'simple-math-3',
    'simple-math-4',
    'simple-math-5',
    'simple-math-6',
    'simple-remainder',
    'simple-words',
    'addition-test'
];
```

**Update error message (line ~20):**
```typescript
return res.status(400).json({
    error: {
        message: 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-math-6, simple-remainder, simple-words, addition-test',
        code: 'INVALID_QUIZ_TYPE'
    }
});
```

---

## Frontend Implementation

### 5. Create Quiz Module
**File:** `src/client/modules/rem-remainder-quiz.js`

```javascript
import QuizBase from './quiz-base.js';

export default class RemRdQuiz extends QuizBase {
    constructor(mathMasterPro) {
        super(mathMasterPro);
        this.currentQuestions = [];
    }

    async startQuiz() {
        if (!this.mathMasterPro.currentToken) {
            this.mathMasterPro.showNotification('Please log in to access quizzes.', 'warning');
            this.mathMasterPro.showScreen('auth');
            return;
        }

        this.resetAllButtons();

        const button = this.mathMasterPro.startMathBtn;
        if (button) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Loading...`;
        }

        this.currentQuizType = 'simple-remainder';

        const response = await fetch(`/session/simple-remainder`, {
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

        this.mathMasterPro.showScreen('quiz');
        this.mathMasterPro.screens.quiz.classList.add('slide-in');

        setTimeout(() => {
            this.renderQuestions();
        }, 300);
    }

    async submitAnswers() {
        let hasUnanswered = this.currentUserAnswers.some(answer => answer === '' || answer === null);

        if (hasUnanswered) {
            this.mathMasterPro.showNotification('Please answer all questions before submitting.', 'warning');
            return;
        }

        const button = this.mathMasterPro.submitBtn;
        if (button) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processing...`;
        }

        const response = await fetch(`/session/simple-remainder`, {
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
                               max="99"
                               step="1"
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

### 6. Update Quiz Manager
**File:** `src/client/modules/quiz-manager.js`

**Add import (at top):**
```javascript
import RemRdQuiz from './rem-remainder-quiz.js';
```

**Update constructor (line ~15):**
```javascript
export default class QuizManager {
    constructor(mathMasterPro) {
        this.mathMasterPro = mathMasterPro;
        this.bodmasQuiz = new BODMASQuiz(mathMasterPro);
        this.spellingQuiz = new SpellingQuiz(mathMasterPro);
        this.factorsQuiz = new FactorsQuiz(mathMasterPro);
        this.lcdQuiz = new LCDQuiz(mathMasterPro);
        this.remRdQuiz = new RemRdQuiz(mathMasterPro);
    }
```

**Update startQuiz method (line ~60):**
```javascript
async startQuiz(quizType) {
    switch (quizType) {
        case 'simple-remainder':
            return await this.remRdQuiz.startQuiz();
        case 'simple-math':
            return await this.bodmasQuiz.startQuiz();
        case 'simple-math-2':
            return await this.bodmasQuiz.startQuiz();
        case 'simple-math-3':
            return await this.factorsQuiz.startQuiz();
        case 'simple-math-4':
            return await this.bodmasQuiz.startQuiz();
        case 'simple-math-5':
            return await this.factorsQuiz.startQuiz();
        case 'simple-math-6':
            return await this.lcdQuiz.startQuiz();
        case 'simple-words':
            return await this.spellingQuiz.startQuiz();
        case 'addition-test':
            return await this.bodmasQuiz.startQuiz();
    }
}
```

**Update submitAnswers method (line ~120):**
```javascript
async submitAnswers() {
    switch (this.currentQuizType) {
        case 'simple-remainder':
            return await this.remRdQuiz.submitAnswers();
        case 'simple-math':
            return await this.bodmasQuiz.submitAnswers();
        case 'simple-math-2':
            return await this.bodmasQuiz.submitAnswers();
        case 'simple-math-3':
            return await this.factorsQuiz.submitAnswers();
        case 'simple-math-4':
            return await this.bodmasQuiz.submitAnswers();
        case 'simple-math-5':
            return await this.factorsQuiz.submitAnswers();
        case 'simple-math-6':
            return await this.lcdQuiz.submitAnswers();
        case 'simple-words':
            return await this.spellingQuiz.submitAnswers();
        case 'addition-test':
            return await this.bodmasQuiz.submitAnswers();
    }
}
```

### 7. Update Quiz Base
**File:** `src/client/modules/quiz-base.js`

**Add button config (after addition-test config, line ~95):**
```javascript
const buttonConfigs = {
    'simple-remainder': { icon: 'fa-divide', text: 'Start Remainder Quiz' },
    'addition-test': { icon: 'fa-plus', text: 'Start Addition Test' },
    'simple-words': { icon: 'fa-book', text: 'Start Spelling Quiz' }
};
```

**Update button config array (line ~105):**
```javascript
const buttonConfigsWithBtns = [
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-times', text: 'Start Multiplication Quiz' },
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-divide', text: 'Start Remainder Quiz' },
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-chart-pie', text: 'Start Fraction Quiz' },
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-calculator', text: 'Start BODMAS Quiz' },
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-superscript', text: 'Start Factors Quiz' },
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-equals', text: 'Start LCD Quiz' },
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-book', text: 'Start Spelling Quiz' },
    { btn: this.mathMasterPro.startMathBtn, icon: 'fa-plus', text: 'Start Addition Test' }
];
```

### 8. Update Main Application
**File:** `src/client/main.js`

**Add to quizNames map (after lcdQuiz, line ~140):**
```javascript
const quizNames = {
    'simple-math': 'Multiplication Quiz',
    'simple-math-2': 'Division Quiz',
    'simple-math-3': 'Fraction Quiz',
    'simple-math-4': 'BODMAS Quiz',
    'simple-math-5': 'Factors Quiz',
    'simple-math-6': 'LCD Quiz',
    'simple-remainder': 'Remainder Quiz',
    'simple-words': 'Spelling Quiz',
    'addition-test': 'Addition Test'
};
```

**Add to fetchMultiplier calls (after lcdQuiz fetch, line ~200):**
```javascript
this.fetchMultiplier('simple-remainder'),
```

**Update updateQuizCardBadges method (line ~220):**
```javascript
const [simpleMath1, simpleMath2, simpleMath3, simpleMath4, simpleMath5, simpleMath6, simpleWords, additionTest, remRd] = multipliers;
```

**Add multiplier assignment (after simpleMath6, line ~250):**
```javascript
const roundedSimpleMath6 = Math.round(simpleMath6);
const roundedRemRd = Math.round(remRd);

// Add multiplier assignments
let multiplier;
if (quizType === 'simple-math') {
    multiplier = roundedSimpleMath1;
} else if (quizType === 'simple-math-2') {
    multiplier = roundedSimpleMath2;
} else if (quizType === 'simple-math-3') {
    multiplier = roundedSimpleMath3;
} else if (quizType === 'simple-math-4') {
    multiplier = roundedSimpleMath4;
} else if (quizType === 'simple-math-5') {
    multiplier = roundedSimpleMath5;
} else if (quizType === 'simple-math-6') {
    multiplier = roundedSimpleMath6;
} else if (quizType === 'simple-remainder') {
    multiplier = roundedRemRd;
} else if (quizType === 'addition-test') {
    multiplier = roundedAdditionTest;
} else if (quizType === 'simple-words') {
    multiplier = roundedSimpleWords;
}
```

### 9. Add Quiz Card
**File:** `src/client/index.html`

**Add card after LCD card (line ~180, before addition-test):**
```html
<div class="quiz-card" data-quiz-type="simple-remainder">
    <div class="quiz-icon">
        <i class="fas fa-divide"></i>
    </div>
    <div class="quiz-info">
        <h4>Remainder Quiz</h4>
        <p>Find the remainder when dividing</p>
    </div>
    <div class="multiplier-badge" data-multiplier="1">x1</div>
    <button class="btn btn-outline start-quiz-btn">Start</button>
</div>
```

---

## Testing Checklist

### Backend Tests
- [ ] Question generator creates valid questions
- [ ] Generator produces answers in range 0-12
- [ ] Session creation succeeds
- [ ] Session validation works correctly
- [ ] API routes return proper status codes
- [ ] Session expires after 10 minutes

### Frontend Tests
- [ ] Quiz card displays in UI
- [ ] Quiz starts with loading spinner
- [ ] Questions render correctly with formatting
- [ ] Answer inputs accept numeric values
- [ ] Validation prevents empty submissions
- [ ] Loading spinner shows during submission
- [ ] Results display with correct score
- [ ] Feedback shows for correct/incorrect answers
- [ ] Progress bar updates correctly
- [ ] Restart button resets quiz state
- [ ] Multiplier badge updates from API
- [ ] Quiz can be completed multiple times

### Integration Tests
- [ ] Authentication required before quiz
- [ ] Token included in API requests
- [ ] Invalid token rejected
- [ ] Session ID persists across requests
- [ ] Score calculation includes multiplier
- [ ] Database stores session records
- [ ] Parent dashboard shows quiz name
- [ ] Parent can edit quiz multiplier

### Edge Cases
- [ ] Zero remainder handled correctly
- [ ] Single-digit divisors (2-9)
- [ ] Ten as divisor works
- [ ] Eleven as divisor works
- [ ] Twelve as divisor works
- [ ] Large dividends (up to 100) work
- [ ] Empty answers rejected
- [ ] Invalid answers rejected
- [ ] Multiple submissions of same quiz
- [ ] Session timeout triggers error

---

## Files to Modify

### Backend
1. `src/server/utils/rem-remainder.generator.ts` (new file)
2. `src/server/session/session.service.impl.ts` (3 changes)
3. `src/server/session/session.controller.ts` (3 changes)
4. `src/server/parent/parent.controller.impl.ts` (2 changes)

### Frontend
5. `src/client/modules/rem-remainder-quiz.js` (new file)
6. `src/client/modules/quiz-manager.js` (3 changes)
7. `src/client/modules/quiz-base.js` (2 changes)
8. `src/client/main.js` (3 changes)
9. `src/client/index.html` (1 new card)

**Total:** 9 files to create or modify
