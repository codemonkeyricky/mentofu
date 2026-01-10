import QuizBase from './quiz-base.js';

// Math quiz module for multiplication problems
export default class MathQuiz extends QuizBase {
    constructor(mathMasterPro) {
        super(mathMasterPro);
        this.currentQuestions = [];
    }

    async startQuiz() {
        try {
            // Check if user is authenticated
            if (!this.mathMasterPro.currentToken) {
                this.mathMasterPro.showNotification('Please log in to access quizzes.', 'warning');
                this.mathMasterPro.showScreen('auth');
                return;
            }

            // Show loading state with professional animation
            const button = this.mathMasterPro.startMathBtn;
            if (button) {
                button.disabled = true;
                const originalHTML = button.innerHTML;
                button.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                `;
                button.setAttribute('data-original-html', originalHTML);
            }

            this.currentQuizType = 'math';

            // Fetch new session from API
            const response = await fetch('/session/simple-math', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.mathMasterPro.currentToken}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.currentSessionId = data.sessionId;
            this.currentQuestions = data.questions;
            this.currentUserAnswers = new Array(this.currentQuestions.length).fill(null);

            // Show quiz screen with animation
            this.mathMasterPro.showScreen('quiz');
            this.mathMasterPro.screens.quiz.classList.add('slide-in');

            // Render questions with slight delay for smooth transition
            setTimeout(() => {
                this.renderQuestions();
            }, 300);

        } catch (error) {
            console.error('Error starting quiz:', error);
            this.mathMasterPro.showNotification(
                `Failed to start quiz: ${error.message}. Please try again.`,
                'error'
            );

            // Reset button states
            const button = this.mathMasterPro.startMathBtn;
            if (button) {
                button.disabled = false;
                const originalHTML = button.getAttribute('data-original-html');
                button.innerHTML = originalHTML || this.getDefaultButtonHTML('math');
            }
        }
    }

    async submitAnswers() {
        // Validate all questions are answered
        let hasUnanswered = this.currentUserAnswers.some(answer => answer === '' || answer === null);

        if (hasUnanswered) {
            this.mathMasterPro.showNotification('Please answer all questions before submitting.', 'warning');

            // Add visual feedback for unanswered questions
            document.querySelectorAll('.answer-input').forEach((input, index) => {
                if (!this.currentUserAnswers[index] ||
                    (typeof this.currentUserAnswers[index] === 'string' &&
                     this.currentUserAnswers[index].trim() === '')) {
                    input.classList.add('is-invalid');
                    setTimeout(() => input.classList.remove('is-invalid'), 2000);
                }
            });

            return;
        }

        try {
            // Show professional loading state
            const button = this.mathMasterPro.submitBtn;
            if (button) {
                button.disabled = true;
                button.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                `;
            }

            // Submit to API
            const response = await fetch('/session/simple-math', {
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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Submission failed with status: ${response.status}`);
            }

            const result = await response.json();

            // Show success animation before displaying results
            this.mathMasterPro.screens.quiz.classList.add('fade-out');

            setTimeout(() => {
                // Display results with professional presentation
                this.displayResults(result.score, result.total, result.details);

                // Show results screen with animation
                this.mathMasterPro.screens.results.classList.add('active', 'slide-in');

                this.mathMasterPro.screens.quiz.classList.remove('active', 'fade-out');
            }, 500);

        } catch (error) {
            console.error('Error submitting answers:', error);
            this.mathMasterPro.showNotification(
                `Submission failed: ${error.message}. Please try again.`,
                'error'
            );

            // Reset button states
            const button = this.mathMasterPro.submitBtn;
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Submit Answers';
            }
        }
    }

    // Render questions with professional styling
    renderQuestions() {
        this.mathMasterPro.questionsContainer.innerHTML = '';
        this.mathMasterPro.questionsContainer.classList.remove('fade-out');

        this.currentQuestions.forEach((question, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card animate__animated animate__fadeIn';
            questionCard.style.animationDelay = `${index * 0.1}s`;

            // Handle regular math questions
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

        // Add enhanced event listeners with validation
        document.querySelectorAll('.answer-input').forEach(input => {
            input.addEventListener('input', (event) => this.handleAnswerInput(event));
            input.addEventListener('change', (event) => this.validateAnswerInput(event));
            input.addEventListener('focus', (event) => {
                event.target.classList.add('focus');
            });
            input.addEventListener('blur', (event) => {
                event.target.classList.remove('focus');
            });
        });

        this.updateProgress();
        // Focus on first unanswered question after a short delay
        setTimeout(() => {
            this.scrollToFirstUnanswered();
        }, 100);
    }

    handleAnswerInput(event) {
        const index = parseInt(event.target.dataset.index);
        const value = event.target.value;

        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
            this.currentUserAnswers[index] = value === '' ? null : parseFloat(value);
            event.target.classList.toggle('has-value', value !== '');
        } else {
            event.target.value = this.currentUserAnswers[index] || '';
        }

        this.updateProgress();
    }

    validateAnswerInput(event) {
        const input = event.target;
        const value = input.value;

        if (input.type === 'number' && value !== '') {
            const numValue = parseFloat(value);
            const min = parseFloat(input.min) || -Infinity;
            const max = parseFloat(input.max) || Infinity;

            if (numValue < min || numValue > max) {
                input.classList.add('is-invalid');
                this.mathMasterPro.showNotification(
                    `Please enter a value between ${min} and ${max}`,
                    'warning'
                );
            } else {
                input.classList.remove('is-invalid');
            }
        }
    }

    restartQuiz() {
        // Cleanup charts and animations
        this.cleanupCharts();

        // Add fade-out animation to results screen
        this.mathMasterPro.screens.results.classList.add('fade-out');

        setTimeout(() => {
            // Reset variables
            this.currentSessionId = '';
            this.currentQuestions = [];
            this.currentUserAnswers = [];

            // Hide results screen and show start screen with animation
            this.mathMasterPro.screens.results.classList.remove('active', 'fade-out', 'slide-in');
            this.mathMasterPro.screens.start.classList.add('active', 'slide-in');

            // Re-enable buttons with professional styling
            this.resetAllButtons();
        }, 300);
    }
}