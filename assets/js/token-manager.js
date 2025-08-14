// Token Manager for handling Auth0 JWT tokens
class TokenManager {
    constructor() {
        this.tokenKey = 'access_token';
        this.checkInterval = null;
        this.sessionActive = false;
        // Don't auto-initialize - wait for explicit session start
    }

    // Start a new session after successful login
    startSession(token) {
        this.setToken(token);
        this.sessionActive = true;
        console.log('Session started with token:', token.substring(0, 20) + '...');
        
        // Decode and log token info for debugging
        const decoded = this.decodeToken(token);
        if (decoded) {
            const expiresAt = new Date(decoded.exp * 1000);
            console.log('Token expires at:', expiresAt);
            console.log('Token valid for:', Math.floor((decoded.exp * 1000 - Date.now()) / 1000 / 60), 'minutes');
        }
        
        // Start periodic token checking (every 5 minutes)
        this.startTokenChecking();
    }

    // End the current session
    endSession() {
        this.sessionActive = false;
        this.removeToken();
        this.stopTokenChecking();
        console.log('Session ended');
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    removeToken() {
        localStorage.removeItem(this.tokenKey);
    }

    // Check if token exists
    hasToken() {
        return !!this.getToken();
    }

    // Decode JWT token without verification (client-side)
    decodeToken(token) {
        try {
            console.log('Attempting to decode token:', token.substring(0, 50) + '...');
            
            // Check if token has the correct JWT structure (3 parts separated by dots)
            const parts = token.split('.');
            console.log('Token parts count:', parts.length);
            
            if (parts.length !== 3) {
                console.error('Token does not have 3 parts (header.payload.signature)');
                return null;
            }
            
            const base64Url = parts[1]; // payload is the second part
            console.log('Base64Url payload:', base64Url.substring(0, 20) + '...');
            
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const decoded = JSON.parse(jsonPayload);
            console.log('Decoded token payload:', decoded);
            
            return decoded;
        } catch (error) {
            console.error('Error decoding token:', error);
            console.error('Token that failed to decode:', token);
            return null;
        }
    }

    // Check if token is expired (client-side check)
    isTokenExpired(token = null) {
        const tokenToCheck = token || this.getToken();
        if (!tokenToCheck) {
            console.log('No token found, considering expired');
            return true;
        }

        const decoded = this.decodeToken(tokenToCheck);
        if (!decoded || !decoded.exp) {
            console.log('Cannot decode token or no expiry, considering expired');
            return true;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = decoded.exp < currentTime;
        
        if (isExpired) {
            console.log('Token expired. Expiry:', new Date(decoded.exp * 1000), 'Current:', new Date());
        } else {
            console.log('Token still valid for:', Math.floor((decoded.exp - currentTime) / 60), 'minutes');
        }
        
        return isExpired;
    }

    // Verify token with server
    async verifyTokenWithServer() {
        const token = this.getToken();
        if (!token) {
            console.log('No token to verify with server');
            return false;
        }

        try {
            console.log('Verifying token with server...');
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Server verification response status:', response.status);
            
            if (!response.ok) {
                const data = await response.json();
                console.log('Server verification failed:', data);
                
                if (response.status === 401 && data.expired) {
                    console.log('Server says token is expired');
                    this.handleTokenExpired();
                    return false;
                }
                return false;
            }

            const data = await response.json();
            console.log('Server verification successful:', data);
            return true;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    }

    // Handle token expiration
    handleTokenExpired() {
        console.log('Token expired, ending session...');
        this.endSession();
        
        // Show notification to user
        this.showExpirationNotification();
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }

    // Show expiration notification
    showExpirationNotification() {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3';
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="icon-base ri-time-line me-2"></i>
                <span>Your session has expired. Redirecting to login...</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after redirect
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    // Start periodic token checking
    startTokenChecking() {
        // Only start if session is active
        if (!this.sessionActive) {
            return;
        }
        
        // Stop any existing interval
        this.stopTokenChecking();
        
        console.log('Starting token validation checks every 5 minutes');
        
        // Check every 5 minutes (300,000 milliseconds)
        this.checkInterval = setInterval(() => {
            this.checkTokenValidity();
        }, 300000);
    }

    // Stop periodic token checking
    stopTokenChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // Check token validity (combines client and server checks)
    async checkTokenValidity() {
        // Only check if session is active
        if (!this.sessionActive) {
            console.log('Session not active, skipping token check');
            return false;
        }
        
        console.log('Checking token validity...');
        
        if (!this.hasToken()) {
            console.log('No token found');
            this.handleTokenExpired();
            return false;
        }

        // Only do client-side check for now (disable server check to avoid immediate redirects)
        if (this.isTokenExpired()) {
            console.log('Client-side check: token expired');
            this.handleTokenExpired();
            return false;
        }

        console.log('Client-side check: token still valid');
        
        // Skip server verification for now to avoid immediate logouts
        // TODO: Re-enable after fixing server verification issues
        return true;
        
        /* Disabled server verification temporarily
        try {
            const serverValid = await this.verifyTokenWithServer();
            console.log('Server verification result:', serverValid);
            return serverValid;
        } catch (error) {
            console.error('Server verification error, but keeping session active:', error);
            return true;
        }
        */
    }

    // Logout method
    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            this.endSession();
            
            // Redirect to Auth0 logout URL to clear Auth0 session
            if (data.logoutURL) {
                window.location.href = data.logoutURL;
            } else {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback: clear token and redirect
            this.endSession();
            window.location.href = '/login';
        }
    }

    // Method to make authenticated requests
    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            window.location.href = '/login';
            return null;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle token expiration in API responses
            if (response.status === 401) {
                const data = await response.json();
                if (data.expired) {
                    this.handleTokenExpired();
                    return null;
                }
            }

            return response;
        } catch (error) {
            console.error('Authenticated request failed:', error);
            return null;
        }
    }
}

// Create global instance
const tokenManager = new TokenManager();

// Export for use in other scripts
window.tokenManager = tokenManager;
