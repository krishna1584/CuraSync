const User = require('../models/User');
const { verifyToken } = require('../utils/auth');

// Reads the JWT from the Authorization header only. The cookie is deliberately not
// accepted here: it is SameSite=None in production, so trusting it would allow CSRF.
const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = auth;
module.exports.protect = auth; // Export as 'protect' for compatibility
