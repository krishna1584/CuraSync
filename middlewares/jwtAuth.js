const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
exports.authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header or cookies (updated to use 'token' cookie)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user by ID from token
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }

        // Add user info to request object
        req.user = {
            id: user._id,
            email: user.email,
            name: user.name
        };

        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(403).json({ error: 'Invalid token.' });
    }
};

// Middleware for routes that require authentication (redirects to login for web pages)
exports.requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        req.user = {
            id: user._id,
            email: user.email,
            name: user.name
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.clearCookie('token');
        return res.redirect('/login');
    }
};

// Utility function to generate JWT token
exports.generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            name: user.name 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '1h',
            algorithm: 'HS256'
        }
    );
};

// Utility function for consistent cookie configuration
exports.getCookieOptions = () => {
    return {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    };
    
};