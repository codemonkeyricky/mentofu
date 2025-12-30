// Spelling quiz module
class SpellingQuiz extends QuizBase {
    constructor(mathMasterPro) {
        super(mathMasterPro);
        this.currentWords = [];
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
            const button = this.mathMasterPro.startWordsBtn;
            if (button) {
                button.disabled = true;
                const originalHTML = button.innerHTML;
                button.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                `;
                button.setAttribute('data-original-html', originalHTML);
            }

            this.currentQuizType = 'words';

            // Fetch new session from API
            const response = await fetch('/session/simple-words', {
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
            this.currentWords = data.words;
            this.currentUserAnswers = new Array(this.currentWords.length).fill('');

            // Show words screen with animation
            this.mathMasterPro.showScreen('words');
            this.mathMasterPro.screens.words.classList.add('slide-in');

            // Render words with slight delay
            setTimeout(() => {
                this.renderWords();
            }, 300);

        } catch (error) {
            console.error('Error starting quiz:', error);
            this.mathMasterPro.showNotification(
                `Failed to start quiz: ${error.message}. Please try again.`,
                'error'
            );

            // Reset button states
            const button = this.mathMasterPro.startWordsBtn;
            if (button) {
                button.disabled = false;
                const originalHTML = button.getAttribute('data-original-html');
                button.innerHTML = originalHTML || this.getDefaultButtonHTML('words');
            }
        }
    }

    async submitAnswers() {
        // Validate all questions are answered
        let hasUnanswered = this.currentUserAnswers.some(answer => !answer || answer.trim() === '');

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
            const button = this.mathMasterPro.submitWordsBtn;
            if (button) {
                button.disabled = true;
                button.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                `;
            }

            // Submit to API
            const response = await fetch('/session/simple-words', {
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
            this.mathMasterPro.screens.words.classList.add('fade-out');

            setTimeout(() => {
                // Display results with professional presentation
                this.displayResults(result.score, result.total, result.details);

                // Show results screen with animation
                this.mathMasterPro.screens.results.classList.add('active', 'slide-in');

                this.mathMasterPro.screens.words.classList.remove('active', 'fade-out');
            }, 500);

        } catch (error) {
            console.error('Error submitting answers:', error);
            this.mathMasterPro.showNotification(
                `Submission failed: ${error.message}. Please try again.`,
                'error'
            );

            // Reset button states
            const button = this.mathMasterPro.submitWordsBtn;
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Submit Answers';
            }
        }
    }

    // Render words with professional styling
    renderWords() {
        this.mathMasterPro.wordsContainer.innerHTML = '';
        this.mathMasterPro.wordsContainer.classList.remove('fade-out');

        this.currentWords.forEach((word, index) => {
            const wordCard = document.createElement('div');
            wordCard.className = 'question-card animate__animated animate__fadeIn';
            wordCard.style.animationDelay = `${index * 0.1}s`;

            wordCard.innerHTML = `
                <div class="card-header">
                    <span class="badge bg-success">Word ${index + 1}</span>
                    <span class="question-type">Spelling Challenge</span>
                </div>
                <div class="card-body">
                    <div class="word-content">
                        <div class="word-hint mb-3">
                            <h6 class="text-muted mb-2">Listen and spell:</h6>
                            <p class="h5 text-dark">${word.hint || 'Listen to the word and type it below'}</p>
                        </div>

                        <div class="word-controls d-flex align-items-center mb-4">
                            <button class="btn btn-outline-primary play-button me-3"
                                    data-word="${word.word}"
                                    data-index="${index}">
                                <i class="fas fa-volume-up me-2"></i>Play Audio
                            </button>
                            <div class="text-muted">
                                <small><i class="fas fa-info-circle me-1"></i>Click to hear pronunciation</small>
                            </div>
                        </div>

                        <div class="answer-section">
                            <label for="word-${index}" class="form-label">Type the word:</label>
                            <input type="text"
                                   class="form-control form-control-lg answer-input"
                                   id="word-${index}"
                                   placeholder="Type the word here..."
                                   data-index="${index}"
                                   autocomplete="off"
                                   spellcheck="false">
                            <div class="form-text d-flex justify-content-between align-items-center mt-2">
                                <span>Length: ${word.word?.length || '?'} letters</span>
                                <span class="char-counter">0/${word.word?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.mathMasterPro.wordsContainer.appendChild(wordCard);
        });

        // Add enhanced event listeners
        document.querySelectorAll('.answer-input').forEach(input => {
            input.addEventListener('input', (event) => {
                this.handleWordInput(event);
                this.updateCharCounter(event.target);
            });
            input.addEventListener('focus', (event) => {
                event.target.classList.add('focus');
            });
            input.addEventListener('blur', (event) => {
                event.target.classList.remove('focus');
            });
        });

        // Add event listeners to play buttons
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', (event) => this.handlePlayButtonClick(event));
        });

        this.updateWordProgress();
        this.scrollToFirstUnanswered();
    }

    handleWordInput(event) {
        const index = parseInt(event.target.dataset.index);
        const value = event.target.value.trim();
        this.currentUserAnswers[index] = value;
        this.updateWordProgress();
    }

    updateCharCounter(input) {
        const counter = input.parentElement.querySelector('.char-counter');
        if (counter) {
            const currentLength = input.value.length;
            const maxLength = parseInt(counter.textContent.split('/')[1]) || 0;
            counter.textContent = `${currentLength}/${maxLength}`;
            counter.classList.toggle('text-danger', currentLength > maxLength);
        }
    }

    async handlePlayButtonClick(event) {
        const word = event.target.dataset.word;
        const button = event.target;

        if (!word) return;

        // Visual feedback for playing audio
        button.disabled = true;
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Playing...';

        try {
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(word);
                utterance.rate = 0.8;
                utterance.pitch = 1.2;
                utterance.volume = 1;

                // Try to use a child-friendly voice
                const voices = speechSynthesis.getVoices();
                const preferredVoice = voices.find(voice =>
                    voice.lang.startsWith('en') &&
                    (voice.name.includes('Child') || voice.name.includes('Kids'))
                );

                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }

                utterance.onend = () => {
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                };

                utterance.onerror = () => {
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                    this.mathMasterPro.showNotification(
                        'Could not play audio. Please try again.',
                        'warning'
                    );
                };

                speechSynthesis.speak(utterance);
            } else {
                throw new Error('Speech synthesis not supported');
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            button.disabled = false;
            button.innerHTML = originalHTML;
            this.mathMasterPro.showNotification(
                'Audio playback is not supported in your browser.',
                'warning'
            );
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
            this.currentWords = [];
            this.currentUserAnswers = [];

            // Hide results screen and show start screen with animation
            this.mathMasterPro.screens.results.classList.remove('active', 'fade-out', 'slide-in');
            this.mathMasterPro.screens.start.classList.add('active', 'slide-in');

            // Re-enable buttons with professional styling
            this.resetAllButtons();
        }, 300);
    }
}