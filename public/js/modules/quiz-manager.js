// Main Quiz Manager that coordinates between different quiz types
class QuizManager {
    constructor(mathMasterPro) {
        this.mathMasterPro = mathMasterPro;
        this.currentQuizType = 'math';

        // Initialize domain-specific quiz modules
        this.mathQuiz = new MathQuiz(mathMasterPro);
        this.divisionQuiz = new DivisionQuiz(mathMasterPro);
        this.fractionQuiz = new FractionQuiz(mathMasterPro);
        this.spellingQuiz = new SpellingQuiz(mathMasterPro);
    }

    async startQuiz(quizType) {
        this.currentQuizType = quizType;

        switch (quizType) {
            case 'math':
                return await this.mathQuiz.startQuiz();
            case 'math-2':
                return await this.divisionQuiz.startQuiz();
            case 'math-3':
                return await this.fractionQuiz.startQuiz();
            case 'words':
                return await this.spellingQuiz.startQuiz();
            default:
                console.error('Invalid quiz type:', quizType);
                this.mathMasterPro.showNotification('Invalid quiz type selected', 'error');
        }
    }

    async submitAnswers() {
        switch (this.currentQuizType) {
            case 'math':
                return await this.mathQuiz.submitAnswers();
            case 'math-2':
                return await this.divisionQuiz.submitAnswers();
            case 'math-3':
                return await this.fractionQuiz.submitAnswers();
            default:
                console.error('Invalid quiz type for submission:', this.currentQuizType);
                this.mathMasterPro.showNotification('Invalid quiz type for submission', 'error');
        }
    }

    async submitWordsAnswers() {
        if (this.currentQuizType === 'words') {
            return await this.spellingQuiz.submitAnswers();
        } else {
            console.error('Invalid quiz type for words submission:', this.currentQuizType);
            this.mathMasterPro.showNotification('Invalid quiz type for words submission', 'error');
        }
    }

    restartQuiz() {
        switch (this.currentQuizType) {
            case 'math':
                return this.mathQuiz.restartQuiz();
            case 'math-2':
                return this.divisionQuiz.restartQuiz();
            case 'math-3':
                return this.fractionQuiz.restartQuiz();
            case 'words':
                return this.spellingQuiz.restartQuiz();
            default:
                console.error('Invalid quiz type for restart:', this.currentQuizType);
                this.mathMasterPro.showNotification('Invalid quiz type for restart', 'error');
        }
    }
}