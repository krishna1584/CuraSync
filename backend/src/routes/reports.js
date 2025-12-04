const express = require('express');
const { 
  upload, 
  uploadReport, 
  getAllReports,
  getReportById,
  getMyReports,
  deleteReport,
  updateReport,
  getReportStats
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Report routes
router.get('/', getAllReports);                                    // GET /api/reports - Get all reports (with filters)
router.get('/my-reports', getMyReports);                          // GET /api/reports/my-reports - Get current user's reports
router.get('/stats', getReportStats);                             // GET /api/reports/stats - Get report statistics
router.get('/:id', getReportById);                                // GET /api/reports/:id - Get single report
router.post('/upload', upload.single('reportFile'), uploadReport); // POST /api/reports/upload - Upload new report
router.put('/:id', updateReport);                                 // PUT /api/reports/:id - Update report (review)
router.delete('/:id', deleteReport);                              // DELETE /api/reports/:id - Delete report

module.exports = router;