import QuizManager from './modules/quiz-manager.js';

// Main Application Entry Point - Professional Version
export class MathMasterPro {
    constructor() {
        this.initDOMReferences();
        this.initGlobalVariables();
        this.initEventListeners();
        this.checkAuthentication();
        this.initTimer();

        // Initialize quiz manager
        this.quizManager = new QuizManager(this);
    }

    initDOMReferences() {
        // Screen Elements
        this.screens = {
            auth: document.getElementById('auth-screen'),
            login: document.getElementById('login-screen'),
            register: document.getElementById('register-screen'),
            start: document.getElementById('start-screen'),
            quiz: document.getElementById('quiz-screen'),
            words: document.getElementById('simple-words-screen'),
            results: document.getElementById('results-screen'),
            claimCredit: document.getElementById('claim-credit-screen')
        };

        // Auth Elements
        this.loginBtn = document.getElementById('login-btn');
        this.registerBtn = document.getElementById('register-btn');
        this.showRegisterLink = document.getElementById('show-register');
        this.showLoginLink = document.getElementById('show-login');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.userInfo = document.getElementById('user-info');

        // Quiz Elements - Updated to remove hardcoded IDs and use data attributes
        this.claimCreditBtn = document.getElementById('claim-credit-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.submitWordsBtn = document.getElementById('submit-words-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.backToStartBtn = document.getElementById('back-to-start-btn');
        this.dashboardBtn = document.getElementById('dashboard-btn');
        this.logoutBtn = document.getElementById('logout-btn');

        // Display Elements
        this.questionsContainer = document.getElementById('questions-container');
        this.wordsContainer = document.getElementById('words-container');
        this.questionNumberElement = document.getElementById('question-number');
        this.wordNumberElement = document.getElementById('word-number');
        this.progressFill = document.getElementById('progress-fill');
        this.wordProgressFill = document.getElementById('word-progress-fill');
        this.scoreDisplay = document.getElementById('score-display');
        this.reportsContainer = document.getElementById('reports-container');
        this.usernameDisplay = document.getElementById('username-display');
        this.resultsBreakdown = document.getElementById('results-breakdown');
        this.achievementsList = document.getElementById('achievements-list');

        // Timer Elements
        this.quizTimer = {
            element: document.getElementById('timer-value'),
            interval: null,
            startTime: null,
            elapsed: 0
        };

        this.wordsTimer = {
            element: document.getElementById('words-timer-value'),
            interval: null,
            startTime: null,
            elapsed: 0
        };
    }

    initGlobalVariables() {
        this.currentSessionId = '';
        this.currentQuestions = [];
        this.currentUserAnswers = [];
        this.currentWords = [];
        this.currentQuizType = 'math';
        this.currentUser = null;
        this.currentToken = null;
        this.fractionCharts = [];
        this.quizStats = {
            totalQuizzes: 0,
            averageScore: 0
        };
    }

    initEventListeners() {
        // Auth Event Listeners
        this.loginBtn?.addEventListener('click', () => this.showScreen('login'));
        this.registerBtn?.addEventListener('click', () => this.showScreen('register'));

        this.showRegisterLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('register');
        });

        this.showLoginLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('login');
        });

        this.loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            await this.loginUser(username, password);
        });

        this.registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            await this.registerUser(username, password);
        });

        // Quiz Event Listeners - Updated to use data attributes
        // Handle start quiz buttons in the quiz cards
        const startQuizButtons = document.querySelectorAll('.start-quiz-btn');
        startQuizButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const card = e.target.closest('.quiz-card');
                if (card && card.dataset.quizType) {
                    this.quizManager.startQuiz(card.dataset.quizType);
                }
            });
        });

        // Handle claim credit button
        this.claimCreditBtn?.addEventListener('click', () => {
            if (!this.currentToken) {
                this.showNotification('Please log in to view reports', 'warning');
                this.showScreen('auth');
                return;
            }
            this.showScreen('claimCredit');
            this.fetchClaimCredit();
        });

        this.submitBtn?.addEventListener('click', () => this.quizManager.submitAnswers());
        this.submitWordsBtn?.addEventListener('click', () => this.quizManager.submitWordsAnswers());
        this.restartBtn?.addEventListener('click', () => this.quizManager.restartQuiz());
        this.dashboardBtn?.addEventListener('click', () => this.showScreen('start'));
        this.backToStartBtn?.addEventListener('click', () => this.showScreen('start'));
        this.logoutBtn?.addEventListener('click', () => this.logoutUser());

        // Handle claim credit button
        const claimCreditsBtn = document.getElementById('claim-credits-btn');
        claimCreditsBtn?.addEventListener('click', () => {
            if (!this.currentToken) {
                this.showNotification('Please log in to claim credits', 'warning');
                this.showScreen('auth');
                return;
            }
            const creditsInput = document.getElementById('credits-input');
            if (creditsInput && creditsInput.value) {
                this.claimCredits(parseInt(creditsInput.value));
            } else {
                this.showNotification('Please enter a valid credit amount', 'warning');
            }
        });

        // Add cleanup observer for charts
        this.initChartCleanupObserver();
    }

    initChartCleanupObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!this.screens.quiz.classList.contains('active')) {
                        this.cleanupCharts();
                    }
                }
            });
        });

        observer.observe(this.screens.quiz, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    initTimer() {
        // Timer will be started when quiz begins
    }

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }

        // Update UI based on screen
        if (screenName === 'start' && this.currentUser) {
            this.updateUserInfo();
            this.updateDashboardStats();
            this.initForestRendering();
        }

        // Focus on the first interactive element in the active screen
        setTimeout(() => {
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen) {
                // Try to focus on the first input or button in the active screen
                const firstInput = activeScreen.querySelector('input, button');
                if (firstInput) {
                    firstInput.focus();
                }
            }
        }, 100);
    }

    showAuthScreens() {
        this.showScreen('auth');
    }

    showAuthenticatedScreens() {
        this.showScreen('start');
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (token) {
            this.currentToken = token;
            this.currentUser = JSON.parse(localStorage.getItem('user')) || {};
            this.showAuthenticatedScreens();
        } else {
            this.showAuthScreens();
        }
    }

    async loginUser(username, password) {
        try {
            // Show loading state
            const submitBtn = this.loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            submitBtn.disabled = true;

            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Store token and user info
            this.currentToken = data.token;
            this.currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Clear form and show success
            this.loginForm.reset();
            this.showNotification('Login successful!', 'success');
            this.showAuthenticatedScreens();

        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please check your credentials.', 'error');
        } finally {
            // Reset button state
            const submitBtn = this.loginForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            submitBtn.disabled = false;
        }
    }

    async registerUser(username, password) {
        try {
            // Show loading state
            const submitBtn = this.registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;

            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // Auto-login after registration
            const loginResponse = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!loginResponse.ok) {
                throw new Error(`Auto-login failed: ${loginResponse.status}`);
            }

            const loginData = await loginResponse.json();

            // Store token and user info
            this.currentToken = loginData.token;
            this.currentUser = loginData.user;
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));

            // Clear form and show success
            this.registerForm.reset();
            this.showNotification('Account created successfully!', 'success');
            this.showAuthenticatedScreens();

        } catch (error) {
            console.error('Registration error:', error);
            const message = error.message.includes('already taken')
                ? 'Username is already taken. Please choose another.'
                : 'Registration failed. Please try again.';
            this.showNotification(message, 'error');
        } finally {
            // Reset button state
            const submitBtn = this.registerForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Account';
            submitBtn.disabled = false;
        }
    }

    logoutUser() {
        this.currentToken = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showNotification('Logged out successfully', 'info');
        this.showAuthScreens();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to body
        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Add CSS for notifications if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 25px;
                    border-radius: 10px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 1000;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    animation: slideIn 0.3s ease;
                }
                .notification-success { background: linear-gradient(135deg, #2ecc71, #27ae60); }
                .notification-error { background: linear-gradient(135deg, #e74c3c, #c0392b); }
                .notification-warning { background: linear-gradient(135deg, #f39c12, #d35400); }
                .notification-info { background: linear-gradient(135deg, #3498db, #2980b9); }
                .fade-out { animation: fadeOut 0.3s ease forwards; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateX(0); }
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    updateUserInfo() {
        if (this.currentUser && this.userInfo) {
            this.userInfo.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Welcome, ${this.currentUser.username}</span>
            `;
        }
        if (this.usernameDisplay && this.currentUser) {
            this.usernameDisplay.textContent = this.currentUser.username;
        }
    }

    async updateDashboardStats() {
        // Update stats from user data or API
        const totalQuizzes = localStorage.getItem('totalQuizzes') || 0;
        const averageScore = localStorage.getItem('averageScore') || 0;

        // Note: The original elements for total-quizzes and average-score were removed
        // to make space for the forest rendering. This method still updates quizStats
        // but doesn't update DOM elements that no longer exist.

        this.quizStats.totalQuizzes = parseInt(totalQuizzes);
        this.quizStats.averageScore = parseFloat(averageScore);

        // Fetch user stats from API if user is authenticated
        if (this.currentToken && this.currentUser) {
            await this.fetchUserStats();
        }
    }

    async fetchUserStats() {
        try {
            const response = await fetch('/stats', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const stats = await response.json();

            // Update dashboard with user stats
            this.displayUserStats(stats);
        } catch (error) {
            console.error('Error fetching user stats:', error);
            // Fallback to local storage if API call fails
            this.displayUserStats({
                totalScore: localStorage.getItem('totalScore') || 0,
                sessionsCount: localStorage.getItem('sessionsCount') || 0
            });
        }
    }

    displayUserStats(stats) {
        // Create or update the user stats display in the dashboard
        const dashboardHeader = document.querySelector('.dashboard-header');
        if (!dashboardHeader) return;

        // Check if stats already exist to avoid duplication
        const existingStatsElement = dashboardHeader.querySelector('.user-stats');
        if (existingStatsElement) {
            existingStatsElement.remove();
        }

        // Create new stats element
        const statsElement = document.createElement('div');
        statsElement.className = 'user-stats';
        statsElement.innerHTML = `
            <div class="stats-container">
                <div class="stat-card">
                    <h4>Total Score</h4>
                    <p class="score-value">${stats.totalScore || 0}</p>
                </div>
                <div class="stat-card">
                    <h4>Claimed Credit</h4>
                    <p class="sessions-value">${stats.claimCredit || 0}</p>
                </div>
            </div>
        `;

        // Insert stats before logout button
        const logoutBtn = dashboardHeader.querySelector('#logout-btn');
        if (logoutBtn) {
            dashboardHeader.insertBefore(statsElement, logoutBtn);
        } else {
            // If no logout button, append to the header
            dashboardHeader.appendChild(statsElement);
        }
    }

    startTimer(timerType = 'quiz') {
        const timer = timerType === 'quiz' ? this.quizTimer : this.wordsTimer;

        clearInterval(timer.interval);
        timer.startTime = Date.now();
        timer.elapsed = 0;

        timer.interval = setInterval(() => {
            timer.elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
            const minutes = Math.floor(timer.elapsed / 60);
            const seconds = timer.elapsed % 60;
            timer.element.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer(timerType = 'quiz') {
        const timer = timerType === 'quiz' ? this.quizTimer : this.wordsTimer;
        clearInterval(timer.interval);
        return timer.elapsed;
    }

    async fetchSessionReports() {
        try {
            const response = await fetch('/session/all', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reports = await response.json();
            this.displaySessionReports(reports);
        } catch (error) {
            console.error('Error fetching session reports:', error);
            this.showNotification(`Failed to fetch reports: ${error.message}`, 'error');
        }
    }

    displaySessionReports(reports) {
        if (!reports || !Array.isArray(reports.sessions) || reports.sessions.length === 0) {
            this.reportsContainer.innerHTML = '<p class="text-center text-muted">No session reports available.</p>';
            return;
        }

        let html = '<div class="reports-list">';
        reports.sessions.forEach(report => {
            const date = new Date(report.completedAt);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const percentage = Math.round((report.score / report.total) * 100);
            
            html += `
                <div class="report-item glass-card mb-3 p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="mb-0">${report.sessionType === 'math' ? 'Math Quiz' : 'Simple Words Quiz'}</h5>
                        <span class="badge ${percentage >= 70 ? 'bg-success' : 'bg-warning'}">${percentage}%</span>
                    </div>
                    <div class="report-details">
                        <p class="mb-1"><strong>Score:</strong> ${report.score}/${report.total}</p>
                        <p class="mb-0 text-muted small"><i class="fas fa-calendar-alt me-1"></i> ${formattedDate}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        this.reportsContainer.innerHTML = html;
    }

    async claimCredits(credits) {
        try {
            if (!this.currentToken) {
                throw new Error('User not authenticated');
            }

            // Validate input
            if (isNaN(credits) || credits <= 0) {
                throw new Error('Invalid credit amount');
            }

            const response = await fetch('/stats/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentToken}`
                },
                body: JSON.stringify({ claimedAmount: credits })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Update the UI with new credit information
            this.showNotification(`Successfully claimed ${credits} credits!`, 'success');

            // Refresh user stats to show updated credit
            this.updateDashboardStats();

            // Clear the input field
            document.getElementById('credits-input').value = '';

            return result;
        } catch (error) {
            console.error('Error claiming credits:', error);
            this.showNotification(`Failed to claim credits: ${error.message}`, 'error');
            throw error;
        }
    }

    initForestRendering() {
        // Only initialize forest rendering once
        if (this.forestInitialized) return;

        // Get the canvas element
        const canvas = document.getElementById('forest-canvas');
        if (!canvas) return;

        // Create a new script element to load the forest module
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'forest.js';
        document.head.appendChild(script);

        this.forestInitialized = true;
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

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new MathMasterPro();
    window.mathMasterPro = app;
    window.app = app;
});
