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