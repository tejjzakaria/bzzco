// User Profile Loader - Loads user info into header
(async function loadUserProfile() {
    // Wait for DOM and tokenManager to be ready
    await new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });

    // Additional small delay to ensure tokenManager is initialized
    await new Promise(resolve => setTimeout(resolve, 200));

    if (window.tokenManager && window.tokenManager.hasToken()) {
        try {
            // Fetch user profile from API
            const response = await window.tokenManager.makeAuthenticatedRequest('/api/auth/profile');

            if (response && response.ok) {
                const data = await response.json();

                if (data.user) {
                    // Extract user information
                    const userName = data.user.name || data.user.email || 'User';
                    const userRole = data.user.role || 'User';

                    // Update UI elements - use querySelectorAll to handle multiple instances
                    const userNameElements = document.querySelectorAll('#userName');
                    const userRoleElements = document.querySelectorAll('#userRole');

                    if (userNameElements.length > 0) {
                        userNameElements.forEach(element => {
                            element.textContent = userName;
                        });
                    }

                    if (userRoleElements.length > 0) {
                        const formattedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);
                        userRoleElements.forEach(element => {
                            element.textContent = formattedRole;
                        });
                    }
                }
            }
        } catch (error) {
            // Silent fail - keep default values
        }
    }
})();
