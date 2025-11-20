const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { requireAuth } = require('../middlewares/jwtAuth');

// Render EJS page with appointment data
router.get('/no-appointments', (req, res) => {
  res.render('no-appointments');
});

router.get('/appointments', requireAuth, async (req, res) => {
  const userEmail = req.user.email; // Get email from JWT
  console.log("Logged in email:", userEmail);

  try {
    // Find appointments matching the logged-in user's email
    const appointments = await Appointment.find({ email: userEmail });

    if (appointments.length === 0) {
      console.log("No appointments");
      return res.redirect('/no-appointments');
    }

    console.log("Yes appointments");
    // Sort the appointments w.r.t the dates
    appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
    return res.render('appointments', { appointments });

  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
