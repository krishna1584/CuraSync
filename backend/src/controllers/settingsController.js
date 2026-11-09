const Settings = require('../models/Settings');
const { isEmailConfigured, isEmailVerificationEnabled } = require('../utils/email');
const { pick, errorDetails } = require('../utils/access');

const EDITABLE_FIELDS = [
  'hospitalName',
  'hospitalEmail',
  'hospitalPhone',
  'allowPublicSignup',
  'requireEmailVerification',
  'emailNotifications'
];

const BOOLEAN_FIELDS = ['allowPublicSignup', 'requireEmailVerification', 'emailNotifications'];

const present = (settings) => ({
  ...pick(settings.toObject(), EDITABLE_FIELDS),
  // Lets the UI warn when email-based settings cannot take effect.
  emailConfigured: isEmailConfigured(),
  // False unless EMAIL_VERIFICATION_ENABLED=true on the server.
  verificationAvailable: isEmailVerificationEnabled(),
  updatedAt: settings.updatedAt
});

// GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getGlobal();
    res.status(200).json({ success: true, data: present(settings) });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to load settings', ...errorDetails(error) });
  }
};

// PUT /api/admin/settings
const updateSettings = async (req, res) => {
  try {
    const updates = pick(req.body, EDITABLE_FIELDS);

    for (const field of BOOLEAN_FIELDS) {
      if (field in updates && typeof updates[field] !== 'boolean') {
        return res.status(400).json({ success: false, message: `${field} must be true or false` });
      }
    }
    if ('hospitalName' in updates && !String(updates.hospitalName).trim()) {
      return res.status(400).json({ success: false, message: 'Hospital name cannot be empty' });
    }

    await Settings.getGlobal();
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Settings saved', data: present(settings) });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to save settings', ...errorDetails(error) });
  }
};

module.exports = { getSettings, updateSettings };
