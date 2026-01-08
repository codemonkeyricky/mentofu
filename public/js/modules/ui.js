// UI Functions
// Show appropriate screens based on authentication status
function showAuthScreens() {
    authScreen.classList.add('active');
    loginScreen.classList.remove('active');
    registerScreen.classList.remove('active');
    startScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    simpleWordsScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    claimCreditScreen.classList.remove('active');
}

function showAuthenticatedScreens() {
    authScreen.classList.remove('active');
    loginScreen.classList.remove('active');
    registerScreen.classList.remove('active');
    startScreen.classList.add('active');
    quizScreen.classList.remove('active');
    simpleWordsScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    claimCreditScreen.classList.remove('active');
}

// Fetch and display claim credit data
async function fetchClaimCredit() {
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

        // Display claim credit data
        displayClaimCredit(reports);
    } catch (error) {
        console.error('Error fetching claim credit data:', error);
        alert(`Failed to fetch claim credit data. Please try again.\nError: ${error.message}`);
    }
}

// Display claim credit data
function displayClaimCredit(reports) {
    // Check if data is properly formatted
    if (!reports || !Array.isArray(reports.sessions)) {
        console.error('Invalid claim credit data format:', reports);
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

// Update the UI to show claim credit button
function updateClaimCreditUI() {
    // This function can be used to update the UI when credits are claimed
    // For now, it's a placeholder that could be extended in the future
}