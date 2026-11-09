const mongoose = require('mongoose');

// Hospital-wide settings. There is exactly one document, with key "global".
const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global',
    unique: true
  },
  hospitalName: { type: String, trim: true, default: 'CuraSync Hospital' },
  hospitalEmail: { type: String, trim: true, lowercase: true, default: '' },
  hospitalPhone: { type: String, trim: true, default: '' },

  // When false, the public patient sign-up form is closed (admins can still add users).
  allowPublicSignup: { type: Boolean, default: true },
  // When true (and email sending is configured), unverified users cannot sign in.
  requireEmailVerification: { type: Boolean, default: false },
  // When true (and email sending is configured), patients get appointment emails.
  emailNotifications: { type: Boolean, default: false }
}, {
  timestamps: true
});

settingsSchema.statics.getGlobal = async function getGlobal() {
  return this.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
module.exports = Settings;
