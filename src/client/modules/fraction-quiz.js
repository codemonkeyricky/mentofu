import QuizBase from './quiz-base.js';

// Fraction comparison quiz module
export default class FractionQuiz extends QuizBase {
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
            const button = this.mathMasterPro.startMath3Btn;
            if (button) {
                button.disabled = true;
                const originalHTML = button.innerHTML;
                button.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                `;
                button.setAttribute('data-original-html', originalHTML);
            }

            this.currentQuizType = 'math-3';

            // Fetch new session from API
            const response = await fetch('/session/simple-math-3', {
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
            const button = this.mathMasterPro.startMath3Btn;
            if (button) {
                button.disabled = false;
                const originalHTML = button.getAttribute('data-original-html');
                button.innerHTML = originalHTML || this.getDefaultButtonHTML('math-3');
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
            const response = await fetch('/session/simple-math-3', {
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

            // Handle fraction comparison questions
            const frac1 = question.question[0];
            const frac2 = question.question[1];

            questionCard.innerHTML = `
                <div class="question-container-compact">
                    <div class="question-info">
                        <span class="badge bg-primary me-2">Q${index + 1}</span>
                    </div>
                    <div class="fraction-comparison-compact flex-grow-1">
                        <div class="fraction-item-compact">
                            <canvas id="chart-${index}-1" width="60" height="60"></canvas>
                            <span class="fraction-label-compact">${frac1.numerator}/${frac1.denominator}</span>
                        </div>
                        <div class="comparison-operator-compact">
                            <select class="form-select form-select-sm answer-input"
                                    id="answer-${index}"
                                    data-index="${index}">
                                <option value="">?</option>
                                <option value="<">&lt;</option>
                                <option value=">">&gt;</option>
                                <option value="=">=</option>
                            </select>
                        </div>
                        <div class="fraction-item-compact">
                            <canvas id="chart-${index}-2" width="60" height="60"></canvas>
                            <span class="fraction-label-compact">${frac2.numerator}/${frac2.denominator}</span>
                        </div>
                    </div>
                </div>
            `;

            this.mathMasterPro.questionsContainer.appendChild(questionCard);
        });

        // Add enhanced event listeners with validation
        document.querySelectorAll('.answer-input').forEach(input => {
            input.addEventListener('input', (event) => this.handleAnswerInput(event));
            input.addEventListener('focus', (event) => {
                event.target.classList.add('focus');
            });
            input.addEventListener('blur', (event) => {
                event.target.classList.remove('focus');
            });
        });

        // Create fraction charts after rendering
        setTimeout(() => {
            this.currentQuestions.forEach((question, index) => {
                const frac1 = question.question[0];
                const frac2 = question.question[1];
                this.createFractionChart(`chart-${index}-1`, frac1.numerator, frac1.denominator);
                this.createFractionChart(`chart-${index}-2`, frac2.numerator, frac2.denominator);
            });
        }, 50);

        this.updateProgress();
        this.scrollToFirstUnanswered();
    }

    handleAnswerInput(event) {
        const index = parseInt(event.target.dataset.index);
        const value = event.target.value;

        if (event.target.tagName === 'SELECT') {
            this.currentUserAnswers[index] = value;
            event.target.classList.toggle('selected', value !== '');
        }

        this.updateProgress();
    }

    createFractionChart(canvasId, numerator, denominator) {
        const existingChartIndex = this.fractionCharts.findIndex(chart => chart.canvasId === canvasId);
        if (existingChartIndex !== -1) {
            const existingChart = this.fractionCharts[existingChartIndex];
            if (existingChart.numerator === numerator && existingChart.denominator === denominator) {
                return existingChart.chart;
            }
            if (existingChart.chart) {
                existingChart.chart.destroy();
            }
            this.fractionCharts.splice(existingChartIndex, 1);
        }

        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const canvasContext = ctx.getContext('2d');

        // Create gradient for filled portion
        const gradient = canvasContext.createLinearGradient(0, 0, 100, 100);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2980b9');

        const data = {
            datasets: [{
                data: [numerator, denominator - numerator],
                backgroundColor: [gradient, '#ecf0f1'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${value} part${value !== 1 ? 's' : ''} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%',
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        };

        const chart = new Chart(canvasContext, config);

        this.fractionCharts.push({
            canvasId: canvasId,
            chart: chart,
            numerator: numerator,
            denominator: denominator
        });

        return chart;
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