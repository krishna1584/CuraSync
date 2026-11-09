const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email-verification', 'password-reset', 'login'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  // Wrong guesses against this code; it is deleted after too many.
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
module.exports = OTP;