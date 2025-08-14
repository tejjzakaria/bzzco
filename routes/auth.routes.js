import express from 'express';
import auth0Client from '../config/auth0.config.js';
import dotenv from 'dotenv';
import axios from 'axios';
import { verifyToken } from '../middleware/jwt.middleware.js';

dotenv.config();

const router = express.Router();

// Middleware to check if user has admin role
const requireAdminRole = async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const userResponse = await auth0Client.users.get({ id: userId });
        const user = userResponse.data || userResponse;
        
        const userRole = user.app_metadata?.role || user.user_metadata?.role || 'customer';
        
        if (userRole !== 'admin') {
            return res.status(403).json({ 
                error: 'Access denied. Admin role required.' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking admin role:', error);
        res.status(500).json({ error: 'Failed to verify admin role' });
    }
};

// Route to verify token status
router.get('/verify', verifyToken, (req, res) => {
    res.status(200).json({ 
        message: 'Token is valid', 
        user: req.user,
        valid: true 
    });
});

// Route to get user profile with role information
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        console.log('Fetching profile for user ID:', userId);
        
        const userResponse = await auth0Client.users.get({ id: userId });
        
        // The Auth0 client returns data wrapped in a 'data' property
        const user = userResponse.data || userResponse;
        
        console.log('Auth0 user data:', {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata
        });
        
        const userProfile = {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.app_metadata?.role || user.user_metadata?.role || 'customer',
            created_at: user.created_at,
            last_login: user.last_login
        };

        console.log('Returning user profile:', userProfile);
        res.status(200).json({ user: userProfile });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

router.post('/sign-up', async (req, res) => {
    const { name, email, password, role = 'customer' } = req.body;

    // Validate role
    const validRoles = ['admin', 'seller', 'customer'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin, seller, or customer.' });
    }

    try {
        const user = await auth0Client.users.create({
            connection: process.env.AUTH0_CONNECTION,
            email,
            password,
            name,
            user_metadata: {
                role: role
            },
            app_metadata: {
                role: role
            }
        });

        res.status(200).json({ message: 'Registration successful!', user });
    } catch (error) {
        console.error('Auth0 registration error:', error);
        const errorMessage = error?.body ? JSON.parse(error.body).message : 'Registration failed';
        res.status(500).json({ error: errorMessage });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const response = await axios.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
            grant_type: 'password',
            username: email,
            password: password,
            audience: process.env.AUTH0_AUDIENCE,
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            realm: process.env.AUTH0_CONNECTION, // Specify the connection name
        });

        const { access_token } = response.data;

        res.status(200).json({ message: 'Login successful!', access_token });
    } catch (error) {
        console.error('Auth0 login error:', error);
        const errorMessage = error?.response?.data?.error_description || 'Login failed';
        res.status(401).json({ error: errorMessage });
    }
});

router.post('/logout', (req, res) => {
    try {
        // Clear any server-side session if you're using sessions
        if (req.session) {
            req.session.destroy();
        }

        // Return logout URL for Auth0 to clear Auth0 session
        const logoutURL = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(process.env.AUTH0_BASE_URL || 'http://localhost:3000')}`;
        
        res.status(200).json({ 
            message: 'Logout successful!', 
            logoutURL 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Debug endpoint to see raw Auth0 user data
router.get('/debug-user', verifyToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        console.log('DEBUG: Fetching raw user data for:', userId);
        
        const userResponse = await auth0Client.users.get({ id: userId });
        console.log('DEBUG: Raw Auth0 response:', JSON.stringify(userResponse, null, 2));
        
        // The Auth0 client returns data wrapped in a 'data' property
        const user = userResponse.data || userResponse;
        
        res.status(200).json({ 
            message: 'Debug user data',
            rawAuth0Data: userResponse,
            actualUserData: user,
            extractedRole: {
                app_metadata_role: user.app_metadata?.role,
                user_metadata_role: user.user_metadata?.role,
                fallback: user.app_metadata?.role || user.user_metadata?.role || 'customer'
            }
        });
    } catch (error) {
        console.error('DEBUG: Error fetching user:', error);
        res.status(500).json({ error: 'Debug failed', details: error.message });
    }
});

// Admin endpoint to get all users from Auth0
router.get('/admin/users', verifyToken, requireAdminRole, async (req, res) => {
    try {
        console.log('Fetching all users from Auth0...');
        
        // Get all users from Auth0
        const usersResponse = await auth0Client.users.getAll({
            search_engine: 'v3',
            per_page: 100, // Adjust as needed
            page: 0
        });
        
        console.log('Raw Auth0 users response:', JSON.stringify(usersResponse, null, 2));
        
        // The Auth0 client returns data wrapped in a 'data' property
        const users = usersResponse.data || usersResponse;
        
        // Process and clean up user data
        const processedUsers = users.map(user => {
            const userData = user.data || user;
            return {
                id: userData.user_id,
                name: userData.name,
                email: userData.email,
                email_verified: userData.email_verified,
                role: userData.app_metadata?.role || userData.user_metadata?.role || 'customer',
                created_at: userData.created_at,
                updated_at: userData.updated_at,
                last_login: userData.last_login,
                logins_count: userData.logins_count,
                picture: userData.picture,
                nickname: userData.nickname,
                user_metadata: userData.user_metadata,
                app_metadata: userData.app_metadata,
                identities: userData.identities
            };
        });
        
        console.log(`Returning ${processedUsers.length} users`);
        
        res.status(200).json({ 
            message: 'Users retrieved successfully',
            count: processedUsers.length,
            users: processedUsers 
        });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

// Admin endpoint to delete a user from Auth0
router.delete('/admin/users/:id', verifyToken, requireAdminRole, async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    try {
        console.log(`Admin deleting user: ${userId}`);
        await auth0Client.users.delete({ id: userId });
        res.status(200).json({ message: 'User deleted successfully', userId });
    } catch (error) {
        console.error('Error deleting user:', error);
        let details = error.message;
        if (error?.response?.data?.message) details = error.response.data.message;
        res.status(500).json({ error: 'Failed to delete user', details });
    }
});

export default router;