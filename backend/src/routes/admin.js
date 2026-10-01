const express = require('express');
const { createAppointment } = require('../controllers/appointmentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Admin routes - all protected with auth middleware
router.use(auth);

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard endpoint' });
});

// Admin can book appointments for patients
router.post('/book-appointment', (req, res, next) => {
  if (!['admin', 'nurse', 'receptionist'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Hospital staff access required' });
  }
  next();
}, createAppointment);

module.exports = router;