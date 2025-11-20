const express = require('express');
const { submitPatientData } = require('../controllers/patientController');
const { authenticateToken } = require('../middlewares/jwtAuth');

const router = express.Router();

// Define route for submitting patient data (requires authentication)
router.post('/home', authenticateToken, submitPatientData);

module.exports = router; 