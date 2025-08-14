// Auth Guard Script - Include this in protected pages
document.addEventListener('DOMContentLoaded', function() {
    if (window.tokenManager) {
        // Check if user has a valid token
        if (!window.tokenManager.hasToken()) {
            // No token, redirect to login
            window.location.href = '/login';
            return;
        }

        // Start session if token exists but session is not active
        if (!window.tokenManager.sessionActive) {
            const token = window.tokenManager.getToken();
            if (token) {
                window.tokenManager.startSession(token);
            } else {
                window.location.href = '/login';
                return;
            }
        }

        // Verify token validity
        window.tokenManager.checkTokenValidity().then(isValid => {
            if (isValid) {
                console.log('User is authenticated and session is active');
            }
            // If invalid, tokenManager will handle redirect automatically
        }).catch(error => {
            console.error('Authentication check failed:', error);
            // Redirect to login on error
            window.location.href = '/login';
        });
    } else {
        console.error('Token manager not found');
        window.location.href = '/login';
    }
});

// Add logout functionality to logout buttons
function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('[data-logout], .logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.tokenManager && window.tokenManager.sessionActive) {
                window.tokenManager.logout();
            } else {
                // Fallback logout
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
        });
    });
}

// Setup logout buttons when DOM is ready
document.addEventListener('DOMContentLoaded', setupLogoutButtons);
