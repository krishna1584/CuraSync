const express = require('express');
const { createAppointment } = require('../controllers/appointmentController');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const { requireRoles, STAFF_ROLES } = require('../utils/access');

const router = express.Router();

// Admin routes - all protected with auth middleware
router.use(auth);

// Hospital staff can book appointments for patients
router.post('/book-appointment', requireRoles(...STAFF_ROLES), createAppointment);

// Hospital-wide settings (admin only)
router.get('/settings', requireRoles('admin'), getSettings);
router.put('/settings', requireRoles('admin'), updateSettings);

module.exports = router;
