import express from 'express';
import auth0Client from '../config/auth0.config.js';
import dotenv from 'dotenv';
import axios from 'axios';
import { verifyToken } from '../middleware/jwt.middleware.js';

dotenv.config();

const router = express.Router();

// Route to verify token status
router.get('/verify', verifyToken, (req, res) => {
    res.status(200).json({ 
        message: 'Token is valid', 
        user: req.user,
        valid: true 
    });
});

router.post('/sign-up', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const user = await auth0Client.users.create({
            connection: process.env.AUTH0_CONNECTION,
            email,
            password,
            name,
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

export default router;