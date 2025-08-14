import { auth } from 'express-openid-connect';
import dotenv from 'dotenv';
dotenv.config();

const auth0Middleware = auth({
    authRequired: false,
    auth0Logout: true,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    secret: process.env.AUTH0_SECRET,
});

export { auth0Middleware };