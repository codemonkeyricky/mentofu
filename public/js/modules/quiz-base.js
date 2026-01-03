// Base class for all quiz types with shared functionality
class QuizBase {
    constructor(mathMasterPro) {
        this.mathMasterPro = mathMasterPro;
        this.currentSessionId = '';
        this.currentUserAnswers = [];
        this.currentQuizType = 'math';
        this.fractionCharts = [];
    }

    // Shared methods for all quiz types
    getDefaultButtonHTML(quizType) {
        const buttonConfigs = {
            'math': { icon: 'fa-calculator', text: 'Start Math Quiz' },
            'math-2': { icon: 'fa-divide', text: 'Start Division Quiz' },
            'math-3': { icon: 'fa-chart-pie', text: 'Start Fraction Comparison' },
            'math-4': { icon: 'fa-calculator', text: 'Start BODMAS Quiz' },
            'words': { icon: 'fa-book', text: 'Start Words Quiz' }
        };

        const config = buttonConfigs[quizType];
        return `<i class="fas ${config.icon}"></i> ${config.text}`;
    }

    resetAllButtons() {
        const buttons = [
            { btn: this.mathMasterPro.startMathBtn, icon: 'fa-calculator', text: 'Start Math Quiz' },
            { btn: this.mathMasterPro.startMath2Btn, icon: 'fa-divide', text: 'Start Division Quiz' },
            { btn: this.mathMasterPro.startMath3Btn, icon: 'fa-chart-pie', text: 'Start Fraction Comparison' },
            { btn: this.mathMasterPro.startMath4Btn, icon: 'fa-calculator', text: 'Start BODMAS Quiz' },
            { btn: this.mathMasterPro.startWordsBtn, icon: 'fa-book', text: 'Start Words Quiz' },
            { btn: this.mathMasterPro.submitBtn, icon: 'fa-paper-plane', text: 'Submit Answers' },
            { btn: this.mathMasterPro.submitWordsBtn, icon: 'fa-paper-plane', text: 'Submit Answers' }
        ];

        buttons.forEach(({ btn, icon, text }) => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = icon ? `<i class="fas ${icon} me-2"></i>${text}` : text;
                btn.classList.remove('disabled', 'loading');
            }
        });
    }

    displayResults(score, total, details = null) {
        const percentage = Math.round((score / total) * 100);

        // Professional score display with gradient based on performance
        let scoreClass = 'score-poor';
        let icon = '📚';
        let message = 'Keep practicing! You\'ll improve with time.';

        if (percentage >= 90) {
            scoreClass = 'score-excellent';
            icon = '🏆';
            message = 'Outstanding! You\'ve mastered this challenge!';
        } else if (percentage >= 75) {
            scoreClass = 'score-good';
            icon = '🌟';
            message = 'Excellent work! You\'re doing great!';
        } else if (percentage >= 60) {
            scoreClass = 'score-average';
            icon = '👍';
            message = 'Good job! Keep up the good work!';
        } else if (percentage >= 40) {
            scoreClass = 'score-fair';
            icon = '💪';
            message = 'Nice effort! Practice makes progress!';
        }

        // Create detailed results if available
        let detailsHTML = '';
        if (details && Array.isArray(details)) {
            detailsHTML = `
                <div class="results-details mt-4">
                    <h5 class="mb-3">Detailed Analysis</h5>
                    <div class="details-grid">
                        ${details.map((detail, index) => `
                            <div class="detail-item ${detail.correct ? 'correct' : 'incorrect'}">
                                <span class="detail-number">${index + 1}</span>
                                <span class="detail-question">${detail.question}</span>
                                <span class="detail-answer">Your answer: ${detail.userAnswer}</span>
                                ${!detail.correct ? `<span class="detail-correct">Correct: ${detail.correctAnswer}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        this.mathMasterPro.scoreDisplay.innerHTML = `
            <div class="score-container ${scoreClass}">
                <div class="score-icon">${icon}</div>
                <div class="score-value">${score}<span class="score-total">/${total}</span></div>
                <div class="score-percentage">${percentage}%</div>
                <div class="progress mt-3">
                    <div class="progress-bar" role="progressbar"
                         style="width: ${percentage}%"
                         aria-valuenow="${percentage}"
                         aria-valuemin="0"
                         aria-valuemax="100">
                    </div>
                </div>
                <div class="score-message mt-3">${message}</div>
                ${detailsHTML}
                <div class="mt-4">
                    <button class="btn btn-outline-primary me-2" onclick="app.quizManager.restartQuiz()">
                        <i class="fas fa-redo me-1"></i>Try Again
                    </button>
                    <button class="btn btn-primary" onclick="app.quizManager.startQuiz('${this.currentQuizType}')">
                        <i class="fas fa-plus-circle me-1"></i>New Quiz
                    </button>
                </div>
            </div>
        `;
    }

    updateProgress() {
        const answeredCount = this.currentUserAnswers.filter(answer =>
            answer !== null && answer !== '' && answer !== undefined
        ).length;

        const questionNumber = answeredCount + 1;
        const totalQuestions = this.currentQuestions.length;

        this.mathMasterPro.questionNumberElement.textContent =
            `Progress: ${questionNumber > totalQuestions ? totalQuestions : questionNumber} of ${totalQuestions}`;

        const progressPercentage = Math.min(100, (answeredCount / totalQuestions) * 100);

        // Update progress bar with animation
        this.mathMasterPro.progressFill.style.transition = 'width 0.5s ease';
        this.mathMasterPro.progressFill.style.width = `${progressPercentage}%`;

        // Update progress text - but don't set textContent on the progress bar itself
        // Instead, we'll update a separate element for percentage display if needed
    }

    updateWordProgress() {
        const answeredCount = this.currentUserAnswers.filter(answer =>
            answer && answer.trim() !== ''
        ).length;

        const wordNumber = answeredCount + 1;
        const totalWords = this.currentWords.length;

        this.mathMasterPro.wordNumberElement.textContent =
            `Progress: ${wordNumber > totalWords ? totalWords : wordNumber} of ${totalWords}`;

        const progressPercentage = Math.min(100, (answeredCount / totalWords) * 100);

        // Update progress bar with animation
        this.mathMasterPro.wordProgressFill.style.transition = 'width 0.5s ease';
        this.mathMasterPro.wordProgressFill.style.width = `${progressPercentage}%`;
        // Don't set textContent on the progress bar itself to avoid rendering issues
    }

    scrollToFirstUnanswered() {
        setTimeout(() => {
            const unansweredInput = document.querySelector('.answer-input:not(.has-value):not(.selected)');
            if (unansweredInput) {
                unansweredInput.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
                unansweredInput.focus();
            }
        }, 500);
    }

    cleanupCharts() {
        this.fractionCharts.forEach(chartInfo => {
            if (chartInfo.chart) {
                chartInfo.chart.destroy();
            }
        });
        this.fractionCharts = [];
    }
}