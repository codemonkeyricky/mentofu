// Base class for all quiz types with shared functionality
export default class QuizBase {
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
            'math-5': { icon: 'fa-superscript', text: 'Start Factors Quiz' },
            'simple-math-6': { icon: 'fa-equals', text: 'Start LCD Quiz' },
            'addition-test': { icon: 'fa-plus', text: 'Start Addition Test' }
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
            { btn: this.mathMasterPro.startMath5Btn, icon: 'fa-superscript', text: 'Start Factors Quiz' },
            { btn: this.mathMasterPro.startMath6Btn, icon: 'fa-equals', text: 'Start LCD Quiz' },
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

        // Create a more streamlined results display that matches our modern design
        let scoreClass = 'score-poor';
        let icon = '📚';
        let message = 'Keep practicing! You\'ll improve with time.';
        let colorClass = 'text-danger';

        if (percentage >= 90) {
            scoreClass = 'score-excellent';
            icon = '🏆';
            message = 'Outstanding! You\'ve mastered this challenge!';
            colorClass = 'text-green';
        } else if (percentage >= 75) {
            scoreClass = 'score-good';
            icon = '🌟';
            message = 'Excellent work! You\'re doing great!';
            colorClass = 'text-green';
        } else if (percentage >= 60) {
            scoreClass = 'score-average';
            icon = '👍';
            message = 'Good job! Keep up the good work!';
            colorClass = 'text-yellow';
        } else if (percentage >= 40) {
            scoreClass = 'score-fair';
            icon = '💪';
            message = 'Nice effort! Practice makes progress!';
            colorClass = 'text-orange';
        }

        // Create breakdown items
        let breakdownHTML = '';
        if (details && Array.isArray(details)) {
            breakdownHTML = `
                <div class="breakdown-item">
                    <span class="breakdown-label"><i class="fas fa-check-circle"></i> Correct Answers</span>
                    <span class="breakdown-value">${score}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label"><i class="fas fa-times-circle"></i> Incorrect Answers</span>
                    <span class="breakdown-value">${total - score}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label"><i class="fas fa-percentage"></i> Accuracy</span>
                    <span class="breakdown-value">${percentage}%</span>
                </div>
            `;
        } else {
            // Fallback to basic breakdown
            breakdownHTML = `
                <div class="breakdown-item">
                    <span class="breakdown-label"><i class="fas fa-tachometer-alt"></i> Score</span>
                    <span class="breakdown-value">${score}/${total}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label"><i class="fas fa-percentage"></i> Accuracy</span>
                    <span class="breakdown-value">${percentage}%</span>
                </div>
            `;
        }

        this.mathMasterPro.scoreDisplay.innerHTML = `
            <div class="score-container ${scoreClass}">
                <div class="score-icon">${icon}</div>
                <div class="score-value">${score}<span class="score-total">/${total}</span></div>
                <div class="score-percentage ${colorClass}">${percentage}%</div>
                <div class="score-message mt-3">${message}</div>
            </div>
        `;

        this.mathMasterPro.resultsBreakdown.innerHTML = breakdownHTML;
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
            } else {
                // If all inputs are filled, focus on the first one
                const firstInput = document.querySelector('.answer-input');
                if (firstInput) {
                    firstInput.focus();
                }
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