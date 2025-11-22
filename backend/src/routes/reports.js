const express = require('express');
const { upload, uploadReport, getAllReports } = require('../controllers/reportController');

const router = express.Router();

// Report routes
router.get('/', getAllReports);                         // GET /api/reports
router.post('/upload', upload.single('reportFile'), uploadReport); // POST /api/reports/upload

module.exports = router;