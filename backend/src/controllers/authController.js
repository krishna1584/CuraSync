const User = require('../models/User');
const OTP = require('../models/OTP');
const { hashPassword, comparePassword, generateToken, verifyToken, generateOTP, authCookieOptions } = require('../utils/auth');
const { errorDetails } = require('../utils/access');
const Settings = require('../models/Settings');
const { isEmailConfigured, isEmailVerificationEnabled, sendOtpEmail } = require('../utils/email');

const OTP_TTL_MS = 10 * 60 * 1000;      // codes expire after 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // at most one new code per minute
const OTP_MAX_ATTEMPTS = 5;              // wrong guesses before a code is destroyed

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

// Verification is enforced only when EMAIL_VERIFICATION_ENABLED=true, an admin turned it on,
// AND email can actually be sent. By default it is off, so test accounts work without email.
const isVerificationRequired = async () => {
  if (!isEmailVerificationEnabled() || !isEmailConfigured()) return false;
  const settings = await Settings.getGlobal();
  return Boolean(settings.requireEmailVerification);
};

// Replace any existing code for this email with a fresh one and email it.
const issueVerificationCode = async (email, name) => {
  const otp = generateOTP();
  await OTP.deleteMany({ email, type: 'email-verification' });
  await OTP.create({
    email,
    otp,
    type: 'email-verification',
    expiresAt: new Date(Date.now() + OTP_TTL_MS)
  });
  return sendOtpEmail(email, otp, name);
};

const signup = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Public sign-up creates patient accounts only. Doctor and staff accounts
    // are created by a hospital admin (POST /api/users).
    if (role && role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Doctor and staff accounts are created by the hospital admin. Please contact your hospital administrator.'
      });
    }

    const settings = await Settings.getGlobal();
    if (!settings.allowPublicSignup) {
      return res.status(403).json({
        success: false,
        message: 'Online registration is currently closed. Please contact the hospital to create an account.'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: typeof phone === 'string' ? phone.trim() : undefined,
      password: await hashPassword(password),
      role: 'patient',
      isVerified: false
    });

    // Verification codes are only created and emailed when verification is turned on.
    const emailSent = isEmailVerificationEnabled()
      ? await issueVerificationCode(normalizedEmail, user.name)
      : false;
    const verificationRequired = await isVerificationRequired();

    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Account created. We sent a verification code to your email.'
        : 'Account created. You can now sign in.',
      data: { user: userResponse, emailSent, verificationRequired }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...errorDetails(error)
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password before revealing anything about the account
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // The "admin" portal is the hospital staff portal (admin, nurse, receptionist).
    const portalRoles = role === 'admin' ? ['admin', 'nurse', 'receptionist'] : [role];
    if (role && !portalRoles.includes(user.role)) {
      return res.status(401).json({
        success: false,
        message: `These credentials belong to a ${user.role} account. Please choose the correct sign-in portal.`
      });
    }

    if (!user.isVerified && await isVerificationRequired()) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before signing in.',
        data: { email: user.email }
      });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    // Set HTTP-only cookie
    res.cookie('token', token, authCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { 
        user: userResponse,
        token 
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...errorDetails(error)
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await comparePassword(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', ...errorDetails(error) });
  }
};

const logout = async (req, res) => {
  try {
    const { maxAge, ...clearOptions } = authCookieOptions();
    res.clearCookie('token', clearOptions);
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...errorDetails(error)
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    if (!isEmailVerificationEnabled()) {
      return res.status(404).json({ success: false, message: 'Email verification is turned off' });
    }

    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const invalid = () => res.status(400).json({ success: false, message: 'Invalid or expired code' });

    const otpRecord = await OTP.findOne({
      email,
      type: 'email-verification',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) return invalid();

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
        await otpRecord.deleteOne();
        return res.status(400).json({
          success: false,
          message: 'Too many wrong attempts. Please request a new code.'
        });
      }
      await otpRecord.save();
      return invalid();
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
    if (!user) return invalid();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...errorDetails(error)
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    if (!isEmailVerificationEnabled()) {
      return res.status(404).json({ success: false, message: 'Email verification is turned off' });
    }

    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Same answer whether or not the account exists, so emails cannot be probed.
    const genericResponse = () => res.status(200).json({
      success: true,
      message: 'If an unverified account exists for this email, a new code has been sent.'
    });

    const user = await User.findOne({ email });
    if (!user || user.isVerified) return genericResponse();

    const recent = await OTP.findOne({
      email,
      type: 'email-verification',
      createdAt: { $gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) }
    });
    if (recent) {
      return res.status(429).json({
        success: false,
        message: 'Please wait a minute before requesting another code.'
      });
    }

    await issueVerificationCode(email, user.name);
    return genericResponse();

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...errorDetails(error)
    });
  }
};

const verify = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      ...errorDetails(error)
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  verify,
  verifyEmail,
  resendOTP,
  changePassword
};