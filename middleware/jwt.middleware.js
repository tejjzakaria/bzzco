import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dotenv from 'dotenv';

dotenv.config();

// Create JWKS client to get Auth0 public keys
const client = jwksClient({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    requestHeaders: {},
    timeout: 30000,
});

// Function to get the signing key
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            return callback(err);
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

// Middleware to verify JWT tokens
export const verifyToken = (req, res, next) => {
    console.log('Verifying token...');
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No auth header or invalid format');
        return res.status(401).json({ 
            error: 'Access token required',
            expired: false 
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token received:', token.substring(0, 20) + '...');

    jwt.verify(token, getKey, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
    }, (err, decoded) => {
        if (err) {
            console.error('JWT verification error:', err.message);
            console.error('Expected audience:', process.env.AUTH0_AUDIENCE);
            console.error('Expected issuer:', `https://${process.env.AUTH0_DOMAIN}/`);
            
            if (err.name === 'TokenExpiredError') {
                console.log('Token is expired');
                return res.status(401).json({ 
                    error: 'Token expired',
                    expired: true 
                });
            }
            console.log('Token verification failed:', err.name);
            return res.status(401).json({ 
                error: 'Invalid token: ' + err.message,
                expired: false 
            });
        }

        console.log('Token verified successfully for user:', decoded.sub);
        req.user = decoded;
        next();
    });
};

// Middleware for optional token verification (won't block if no token)
export const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without user info
    }

    const token = authHeader.substring(7);

    jwt.verify(token, getKey, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
    }, (err, decoded) => {
        if (!err) {
            req.user = decoded;
        }
        next(); // Continue regardless of token validity
    });
};
