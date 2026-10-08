const express = require('express');
const { signup, login, logout, verify, verifyEmail, resendOTP, changePassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/change-password', auth, changePassword);
router.post('/logout', logout);
router.get('/verify', verify); // Token verification endpoint
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);

module.exports = router;