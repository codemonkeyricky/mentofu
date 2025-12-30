// Authentication functions
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