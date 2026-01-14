import QuizBase from './quiz-base.js';

// Quiz module for listing all factors of a given number
export default class FactorsQuiz extends QuizBase {
    constructor(mathMasterPro) {
        super(mathMasterPro);
        this.currentQuestions = [];
    }

    async startQuiz() {
        try {
            if (!this.mathMasterPro.currentToken) {
                this.mathMasterPro.showNotification('Please log in to access quizzes.', 'warning');
                this.mathMasterPro.showScreen('auth');
                return;
            }

            // Set quiz type
            this.currentQuizType = 'math-5';

            const numQuestions = 5;
            this.currentQuestions = Array.from({ length: numQuestions }, () => {
                // Generate a random number between 2 and 50 (inclusive)
                const number = Math.floor(Math.random() * 49) + 2; // 2-50
                return { number, factors: [], answer: null };
            });

            // Compute factors for each question
            this.currentQuestions.forEach(q => {
                const factors = [];
                for (let i = 1; i <= q.number; i++) {
                    if (q.number % i === 0) factors.push(i);
                }
                q.factors = factors;
            });

            this.currentUserAnswers = new Array(numQuestions).fill('');

            this.mathMasterPro.showScreen('quiz');
            this.mathMasterPro.screens.quiz.classList.add('slide-in');

            setTimeout(() => {
                this.renderQuestions();
            }, 300);
        } catch (error) {
            console.error('Error starting factors quiz:', error);
            this.mathMasterPro.showNotification(
                `Failed to start quiz: ${error.message}. Please try again.`,
                'error'
            );
        }
    }

    renderQuestions() {
        this.mathMasterPro.questionsContainer.innerHTML = '';
        this.mathMasterPro.questionsContainer.classList.remove('fade-out');

        this.currentQuestions.forEach((q, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card animate__animated animate__fadeIn';
            questionCard.style.animationDelay = `${index * 0.1}s`;

            questionCard.innerHTML = `
                <div class="question-container-compact">
                    <div class="question-info">
                        <span class="badge bg-primary me-2">Q${index + 1}</span>
                        <span class="question-text-main">List all factors of ${q.number}</span>
                    </div>
                    <div class="answer-wrapper">
                        <input type="text"
                               class="form-control answer-input"
                               id="answer-${index}"
                               placeholder="Enter factors separated by commas (e.g., 1,2,3,6)"
                               data-index="${index}">
                    </div>
                </div>
            `;

            this.mathMasterPro.questionsContainer.appendChild(questionCard);
        });

        // Add event listeners to capture user input
        setTimeout(() => {
            const answerInputs = document.querySelectorAll('.answer-input');
            answerInputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.currentUserAnswers[index] = e.target.value;
                });
            });
        }, 100);

        this.mathMasterPro.questionsContainer.scrollTop = 0;
        this.updateProgress();
    }

    async submitAnswers() {
        const hasUnanswered = this.currentUserAnswers.some(a => a === null || a === '' || a === undefined);
        if (hasUnanswered) {
            this.mathMasterPro.showNotification('Please answer all questions before submitting.', 'warning');
            return;
        }

        let score = 0;
        this.currentQuestions.forEach((q, idx) => {
            // Parse the user's input to get an array of numbers
            const userFactors = this.currentUserAnswers[idx]
                .split(',')
                .map(factor => factor.trim())
                .filter(factor => factor !== '')
                .map(factor => parseInt(factor))
                .filter(factor => !isNaN(factor));

            // Check if all factors provided by user are actual factors of the number
            const allUserFactorsValid = userFactors.every(factor => q.factors.includes(factor));

            // Check if user provided all the actual factors (same length)
            const allActualFactorsProvided = allUserFactorsValid &&
                                            userFactors.length === q.factors.length;

            if (allActualFactorsProvided) {
                score++;
            }
        });

        this.mathMasterPro.screens.quiz.classList.add('fade-out');
        setTimeout(() => {
            this.displayResults(score, this.currentQuestions.length, null);
            this.mathMasterPro.screens.results.classList.add('active', 'slide-in');
            this.mathMasterPro.screens.quiz.classList.remove('active', 'fade-out');
        }, 500);
    }

    restartQuiz() {
        this.cleanupCharts();
        this.mathMasterPro.screens.results.classList.add('fade-out');
        setTimeout(() => {
            this.currentSessionId = '';
            this.currentQuestions = [];
            this.currentUserAnswers = [];
            this.mathMasterPro.screens.results.classList.remove('active', 'fade-out', 'slide-in');
            this.mathMasterPro.screens.start.classList.add('active', 'slide-in');
            this.resetAllButtons();
        }, 300);
    }
}
