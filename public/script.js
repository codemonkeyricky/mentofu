// DOM Elements
const authScreen = document.getElementById('auth-screen');
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const simpleWordsScreen = document.getElementById('simple-words-screen');
const resultsScreen = document.getElementById('results-screen');
const reportsScreen = document.getElementById('reports-screen');

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const startMathBtn = document.getElementById('start-math-btn');
const startMath2Btn = document.getElementById('start-math-2-btn');
const startMath3Btn = document.getElementById('start-math-3-btn');
const startWordsBtn = document.getElementById('start-words-btn');
const reportsBtn = document.getElementById('reports-btn');
const submitBtn = document.getElementById('submit-btn');
const submitWordsBtn = document.getElementById('submit-words-btn');
const restartBtn = document.getElementById('restart-btn');
const backToStartBtn = document.getElementById('back-to-start-btn');

const questionsContainer = document.getElementById('questions-container');
const wordsContainer = document.getElementById('words-container');
const questionNumberElement = document.getElementById('question-number');
const wordNumberElement = document.getElementById('word-number');
const progressFill = document.getElementById('progress-fill');
const wordProgressFill = document.getElementById('word-progress-fill');
const scoreDisplay = document.getElementById('score-display');
const reportsContainer = document.getElementById('reports-container');

// Store chart instances to avoid memory leaks
let fractionCharts = [];

// Global variables
let currentSessionId = '';
let currentQuestions = [];
let currentUserAnswers = [];
let currentWords = [];
let currentQuizType = 'math'; // 'math' or 'words'
let currentUser = null;
let currentToken = null;

// Check if user is already authenticated on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        currentToken = token;
        currentUser = JSON.parse(localStorage.getItem('user'));
        showAuthenticatedScreens();
    } else {
        showAuthScreens();
    }
});

// Show appropriate screens based on authentication status
function showAuthScreens() {
    authScreen.classList.add('active');
    loginScreen.classList.remove('active');
    registerScreen.classList.remove('active');
    startScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    simpleWordsScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    reportsScreen.classList.remove('active');
}

function showAuthenticatedScreens() {
    authScreen.classList.remove('active');
    loginScreen.classList.remove('active');
    registerScreen.classList.remove('active');
    startScreen.classList.add('active');
    quizScreen.classList.remove('active');
    simpleWordsScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    reportsScreen.classList.remove('active');
}

// Start the quiz
async function startQuiz(quizType = 'math') {
    try {
        // Check if user is authenticated
        if (!currentToken) {
            alert('Please log in to take quizzes.');
            showAuthScreens();
            return;
        }

        // Show loading state
        if (quizType === 'math') {
            startMathBtn.disabled = true;
            startMathBtn.textContent = 'Loading...';
        } else if (quizType === 'math-2') {
            startMath2Btn.disabled = true;
            startMath2Btn.textContent = 'Loading...';
        } else if (quizType === 'math-3') {
            startMath3Btn.disabled = true;
            startMath3Btn.textContent = 'Loading...';
        } else {
            startWordsBtn.disabled = true;
            startWordsBtn.textContent = 'Loading...';
        }

        currentQuizType = quizType;

        // Fetch new session from API
        let endpoint;
        if (quizType === 'math') {
            endpoint = '/session/simple-math';
        } else if (quizType === 'math-2') {
            endpoint = '/session/simple-math-2';
        } else if (quizType === 'math-3') {
            endpoint = '/session/simple-math-3';
        } else {
            endpoint = '/session/simple-words';
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentSessionId = data.sessionId;

        if (quizType === 'math' || quizType === 'math-2' || quizType === 'math-3') {
            currentQuestions = data.questions;
            currentUserAnswers = new Array(currentQuestions.length).fill(null);

            // Hide start screen and show quiz screen
            startScreen.classList.remove('active');
            quizScreen.classList.add('active');

            // Render questions
            renderQuestions();
        } else {
            currentWords = data.words;
            currentUserAnswers = new Array(currentWords.length).fill('');

            // Hide start screen and show simple words screen
            startScreen.classList.remove('active');
            simpleWordsScreen.classList.add('active');

            // Render words
            renderWords();
        }

    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Failed to start quiz. Please try again.');
        if (quizType === 'math') {
            startMathBtn.disabled = false;
            startMathBtn.textContent = 'Start Quiz';
        } else if (quizType === 'math-2') {
            startMath2Btn.disabled = false;
            startMath2Btn.textContent = 'Start Division Quiz';
        } else if (quizType === 'math-3') {
            startMath3Btn.disabled = false;
            startMath3Btn.textContent = 'Start Fraction Comparison Quiz';
        } else {
            startWordsBtn.disabled = false;
            startWordsBtn.textContent = 'Start Simple Words Quiz';
        }
    }
}

// Render questions on the screen
function renderQuestions() {
    questionsContainer.innerHTML = '';

    currentQuestions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';

        // Check if this is a fraction comparison question (has array of fraction objects)
        if (Array.isArray(question.question)) {
            // Handle fraction comparison questions
            const frac1 = question.question[0];
            const frac2 = question.question[1];

            questionCard.innerHTML = `
                <div class="question-number">Question ${index + 1}</div>
                <div class="question-text">
                    <div class="fraction-comparison">
                        <div class="fraction-container">
                            <canvas id="chart-${index}-1" width="80" height="80"></canvas>
                            <span class="fraction">${frac1.numerator}/${frac1.denominator}</span>
                        </div>
                        <span class="comparison-operator">?</span>
                        <div class="fraction-container">
                            <canvas id="chart-${index}-2" width="80" height="80"></canvas>
                            <span class="fraction">${frac2.numerator}/${frac2.denominator}</span>
                        </div>
                    </div>
                </div>
                <select class="answer-input" id="answer-${index}" data-index="${index}">
                    <option value="">Select comparison</option>
                    <option value="<">&lt; (less than)</option>
                    <option value=">">&gt; (greater than)</option>
                    <option value="=">= (equal to)</option>
                </select>
            `;

            // Create charts after the DOM is updated
            setTimeout(() => {
                createFractionChart(`chart-${index}-1`, frac1.numerator, frac1.denominator);
                createFractionChart(`chart-${index}-2`, frac2.numerator, frac2.denominator);
            }, 0);
        } else {
            // Handle regular math questions
            questionCard.innerHTML = `
                <div class="question-number">Question ${index + 1}</div>
                <div class="question-text">${question.question}</div>
                <input
                    type="number"
                    class="answer-input"
                    id="answer-${index}"
                    placeholder="?"
                    min="0"
                    max="81"
                    data-index="${index}"
                >
            `;
        }
        questionsContainer.appendChild(questionCard);
    });

    // Add event listeners to answer inputs
    document.querySelectorAll('.answer-input').forEach(input => {
        input.addEventListener('input', handleAnswerInput);
    });

    updateProgress();
}

// Render words on the screen
function renderWords() {
    wordsContainer.innerHTML = '';

    currentWords.forEach((word, index) => {
        const wordCard = document.createElement('div');
        wordCard.className = 'question-card';
        wordCard.innerHTML = `
            <div class="question-number">Word ${index + 1}</div>
            <div class="question-text">${word.hint || `Type the word: ${word.word}`}</div>
            <button class="play-button" data-word="${word.word}" data-index="${index}">🔊</button>
            <input
                type="text"
                class="answer-input"
                id="word-${index}"
                placeholder="?"
                data-index="${index}"
                autocomplete="off"
            >
        `;
        wordsContainer.appendChild(wordCard);
    });

    // Add event listeners to answer inputs
    document.querySelectorAll('.answer-input').forEach(input => {
        input.addEventListener('input', handleWordInput);
    });

    // Add event listeners to play buttons
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', handlePlayButtonClick);
    });

    updateWordProgress();
}

// Handle answer input changes for math quiz
function handleAnswerInput(event) {
    const index = parseInt(event.target.dataset.index);
    const value = event.target.value;

    // For fraction comparison questions, we use a select element with string values
    if (event.target.tagName === 'SELECT') {
        currentUserAnswers[index] = value;
    } else {
        // For regular math questions, only allow numbers and empty values
        if (value === '' || /^\d+$/.test(value)) {
            currentUserAnswers[index] = value === '' ? null : parseInt(value);
        } else {
            // Revert to previous value if invalid input
            event.target.value = currentUserAnswers[index] || '';
        }
    }
}

// Handle answer input changes for words quiz
function handleWordInput(event) {
    const index = parseInt(event.target.dataset.index);
    const value = event.target.value;

    currentUserAnswers[index] = value;
}

// Handle play button clicks for word pronunciation
function handlePlayButtonClick(event) {
    const word = event.target.dataset.word;

    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 1; // Normal speed
        utterance.pitch = 1; // Normal pitch
        utterance.volume = 1; // Full volume

        // Optional: Set voice (browser-dependent)
        // const voices = speechSynthesis.getVoices();
        // if (voices.length > 0) {
        //     utterance.voice = voices[0]; // Use first available voice
        // }

        speechSynthesis.speak(utterance);
    } else {
        console.warn('Speech synthesis not supported in this browser');
        alert('Audio playback is not supported in your browser.');
    }
}

// Helper function to create a pie chart for a fraction
function createFractionChart(canvasId, numerator, denominator) {
    // Check if we already have a chart for this canvas and it's the same data
    const existingChartIndex = fractionCharts.findIndex(chart => chart.canvasId === canvasId);
    if (existingChartIndex !== -1) {
        const existingChart = fractionCharts[existingChartIndex];
        // If we already have a chart with the same parameters, don't recreate it
        if (existingChart.numerator === numerator && existingChart.denominator === denominator) {
            return existingChart.chart;
        }
        // If parameters changed, destroy the old chart
        if (existingChart.chart) {
            existingChart.chart.destroy();
        }
        // Remove the old chart reference
        fractionCharts.splice(existingChartIndex, 1);
    }

    const ctx = document.getElementById(canvasId).getContext('2d');

    // Create chart data: numerator segments in blue, remainder in gray
    const data = {
        datasets: [{
            data: [numerator, denominator - numerator],
            backgroundColor: [
                '#3498db',  // Blue for numerator
                '#95a5a6'   // Gray for remainder
            ],
            borderWidth: 0
        }]
    };

    const config = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            cutout: '70%' // Make it a donut chart
        }
    };

    const chart = new Chart(ctx, config);

    // Store reference to avoid memory leaks and include numerator/denominator for comparison
    fractionCharts.push({
        canvasId: canvasId,
        chart: chart,
        numerator: numerator,
        denominator: denominator
    });

    return chart;
}

// Update progress bar and question counter for math quiz
function updateProgress() {
    const currentQuestionIndex = currentUserAnswers.findIndex(answer => answer === null || answer === '');
    const questionNumber = currentQuestionIndex === -1 ?
        currentQuestions.length :
        currentQuestionIndex + 1;

    questionNumberElement.textContent = `Question ${questionNumber} of ${currentQuestions.length}`;

    const progressPercentage = (questionNumber / currentQuestions.length) * 100;
    progressFill.style.width = `${progressPercentage}%`;
}

// Update progress bar and word counter for words quiz
function updateWordProgress() {
    const currentWordIndex = currentUserAnswers.findIndex(answer => answer === '' || answer === null);
    const wordNumber = currentWordIndex === -1 ?
        currentWords.length :
        currentWordIndex + 1;

    wordNumberElement.textContent = `Word ${wordNumber} of ${currentWords.length}`;

    const progressPercentage = (wordNumber / currentWords.length) * 100;
    wordProgressFill.style.width = `${progressPercentage}%`;
}

// Submit answers to the API
async function submitAnswers() {
    // Check if all questions are answered
    if (currentQuizType === 'math' || currentQuizType === 'math-2' || currentQuizType === 'math-3') {
        // For fraction comparison, we need to check for empty string values (not null)
        const hasUnanswered = currentUserAnswers.some(answer => answer === '' || answer === null);
        if (hasUnanswered) {
            alert('Please answer all questions before submitting!');
            return;
        }
    } else {
        if (currentUserAnswers.includes('') || currentUserAnswers.includes(null)) {
            alert('Please answer all words before submitting!');
            return;
        }
    }

    try {
        // Show loading state
        if (currentQuizType === 'math' || currentQuizType === 'math-2' || currentQuizType === 'math-3') {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        } else {
            submitWordsBtn.disabled = true;
            submitWordsBtn.textContent = 'Submitting...';
        }

        // Prepare answers array
        const answers = (currentQuizType === 'math' || currentQuizType === 'math-2' || currentQuizType === 'math-3')
            ? currentUserAnswers
            : currentUserAnswers;

        // Submit to API
        let endpoint;
        if (currentQuizType === 'math') {
            endpoint = '/session/simple-math';
        } else if (currentQuizType === 'math-2') {
            endpoint = '/session/simple-math-2';
        } else if (currentQuizType === 'math-3') {
            endpoint = '/session/simple-math-3';
        } else {
            endpoint = '/session/simple-words';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                sessionId: currentSessionId,
                answers: answers
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Display results
        displayResults(result.score, result.total);

        // Hide quiz screen and show results screen
        if (currentQuizType === 'math' || currentQuizType === 'math-2') {
            quizScreen.classList.remove('active');
        } else {
            simpleWordsScreen.classList.remove('active');
        }
        resultsScreen.classList.add('active');

    } catch (error) {
        console.error('Error submitting answers:', error);
        alert('Failed to submit answers. Please try again.');
        if (currentQuizType === 'math' || currentQuizType === 'math-2') {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Answers';
        } else {
            submitWordsBtn.disabled = false;
            submitWordsBtn.textContent = 'Submit Answers';
        }
    }
}

// Submit words answers to the API
async function submitWordsAnswers() {
    // Check if all words are answered
    if (currentUserAnswers.includes('') || currentUserAnswers.includes(null)) {
        alert('Please answer all words before submitting!');
        return;
    }

    try {
        // Show loading state
        submitWordsBtn.disabled = true;
        submitWordsBtn.textContent = 'Submitting...';

        // Prepare answers array
        const answers = currentUserAnswers;

        // Submit to API
        const response = await fetch('/session/simple-words', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                sessionId: currentSessionId,
                answers: answers
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Display results
        displayResults(result.score, result.total);

        // Hide quiz screen and show results screen
        simpleWordsScreen.classList.remove('active');
        resultsScreen.classList.add('active');

    } catch (error) {
        console.error('Error submitting words answers:', error);
        alert('Failed to submit answers. Please try again.');
        submitWordsBtn.disabled = false;
        submitWordsBtn.textContent = 'Submit Answers';
    }
}

// Display the quiz results
function displayResults(score, total) {
    const percentage = Math.round((score / total) * 100);

    let message = '';
    if (percentage >= 90) {
        message = '🎉 Amazing! You are a math superstar!';
    } else if (percentage >= 70) {
        message = '👏 Great job! Keep practicing!';
    } else if (percentage >= 50) {
        message = '👍 Good effort! Practice makes progress!';
    } else {
        message = '📚 Keep trying! You\'ll get better with practice!';
    }

    scoreDisplay.innerHTML = `
        <div class="score-number">${score}/${total}</div>
        <div class="score-message">${message}</div>
        <div>Percentage: ${percentage}%</div>
    `;
}

// Cleanup function to destroy charts when leaving quiz screen
function cleanupCharts() {
    fractionCharts.forEach(chartInfo => {
        if (chartInfo.chart) {
            chartInfo.chart.destroy();
        }
    });
    fractionCharts = [];
}

// Restart the quiz
function restartQuiz() {
    // Cleanup charts
    cleanupCharts();

    // Reset variables
    currentSessionId = '';
    currentQuestions = [];
    currentUserAnswers = [];

    // Hide results screen and show start screen
    resultsScreen.classList.remove('active');
    startScreen.classList.add('active');

    // Re-enable buttons
    startMathBtn.disabled = false;
    startMathBtn.textContent = 'Start Math Quiz';
    startMath2Btn.disabled = false;
    startMath2Btn.textContent = 'Start Division Quiz';
    startMath3Btn.disabled = false;
    startMath3Btn.textContent = 'Start Fraction Comparison Quiz';
    startWordsBtn.disabled = false;
    startWordsBtn.textContent = 'Start Simple Words Quiz';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Answers';
    submitWordsBtn.disabled = false;
    submitWordsBtn.textContent = 'Submit Answers';
}

// Login user
async function loginUser(username, password) {
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Store token and user info in localStorage
        currentToken = data.token;
        currentUser = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Show authenticated screens
        showAuthenticatedScreens();
        return true;
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Login failed. Please check your credentials and try again.');
        return false;
    }
}

// Register new user
async function registerUser(username, password) {
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Registration successful, now we need to login to get the token
        const loginResponse = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`HTTP error! status: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();

        // Store token and user info in localStorage
        currentToken = loginData.token;
        currentUser = loginData.user;
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));

        // Show authenticated screens
        showAuthenticatedScreens();
        return true;
    } catch (error) {
        console.error('Error registering:', error);
        if (error.message && error.message.includes('already taken')) {
            alert('Username is already taken. Please choose a different username.');
        } else {
            alert('Registration failed. Please try again.');
        }
        return false;
    }
}

// Logout user
function logoutUser() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuthScreens();
}

// Fetch and display session reports
async function fetchSessionReports() {
    try {
        const response = await fetch('/session/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reports = await response.json();

        // Display reports
        displaySessionReports(reports);
    } catch (error) {
        console.error('Error fetching session reports:', error);
        alert(`Failed to fetch session reports. Please try again.\nError: ${error.message}`);
    }
}

// Display session reports
function displaySessionReports(reports) {
    // Check if reports is properly formatted
    if (!reports || !Array.isArray(reports.sessions)) {
        console.error('Invalid reports data format:', reports);
        reportsContainer.innerHTML = '<p>No session reports available.</p>';
        return;
    }

    if (reports.sessions.length === 0) {
        reportsContainer.innerHTML = '<p>No session reports available.</p>';
        return;
    }

    let html = '<div class="reports-list">';
    reports.sessions.forEach(report => {
        const date = new Date(report.completedAt);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        html += `
            <div class="report-item">
                <h3>${report.sessionType === 'math' ? 'Math Quiz' : 'Simple Words Quiz'}</h3>
                <p><strong>Score:</strong> ${report.score}/${report.total}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Percentage:</strong> ${Math.round((report.score / report.total) * 100)}%</p>
            </div>
        `;
    });
    html += '</div>';

    reportsContainer.innerHTML = html;
}

// Event Listeners for Authentication
loginBtn.addEventListener('click', () => {
    authScreen.classList.remove('active');
    loginScreen.classList.add('active');
});

registerBtn.addEventListener('click', () => {
    authScreen.classList.remove('active');
    registerScreen.classList.add('active');
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginScreen.classList.remove('active');
    registerScreen.classList.add('active');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerScreen.classList.remove('active');
    loginScreen.classList.add('active');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (await loginUser(username, password)) {
        // Clear form
        loginForm.reset();
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    if (await registerUser(username, password)) {
        // Clear form
        registerForm.reset();
        // Hide registration screen after successful registration and login
        registerScreen.classList.remove('active');
        showAuthenticatedScreens();
    }
});

// Event Listeners for Navigation
reportsBtn.addEventListener('click', () => {
    if (!currentToken) {
        alert('Please log in to view reports.');
        showAuthScreens();
        return;
    }

    startScreen.classList.remove('active');
    reportsScreen.classList.add('active');
    fetchSessionReports();
});

backToStartBtn.addEventListener('click', () => {
    reportsScreen.classList.remove('active');
    startScreen.classList.add('active');
});

// Event Listeners for Quiz Navigation
startMathBtn.addEventListener('click', () => startQuiz('math'));
startMath2Btn.addEventListener('click', () => startQuiz('math-2'));
startMath3Btn.addEventListener('click', () => startQuiz('math-3'));
startWordsBtn.addEventListener('click', () => startQuiz('words'));
submitBtn.addEventListener('click', submitAnswers);
submitWordsBtn.addEventListener('click', submitWordsAnswers);
restartBtn.addEventListener('click', restartQuiz);

// Add cleanup when leaving quiz screen
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (!quizScreen.classList.contains('active')) {
                // Quiz screen is no longer active, cleanup charts
                cleanupCharts();
            }
        }
    });
});

// Start observing the quiz screen for class changes
observer.observe(quizScreen, {
    attributes: true,
    attributeFilter: ['class']
});

// Logout button event listener
document.getElementById('logout-btn').addEventListener('click', () => {
  logoutUser();
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set initial screen based on authentication status
    if (currentToken) {
        showAuthenticatedScreens();
    } else {
        showAuthScreens();
    }
});