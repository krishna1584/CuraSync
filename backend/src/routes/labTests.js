const express = require('express');
const { 
  getAllLabTests,
  bookLabTest,
  getLabTestById,
  updateLabTest,
  getLabTestsByPatient
} = require('../controllers/labTestController');

const router = express.Router();

// Lab test routes
router.get('/', getAllLabTests);                        // GET /api/lab-tests
router.post('/book', bookLabTest);                      // POST /api/lab-tests/book
router.get('/:id', getLabTestById);                     // GET /api/lab-tests/:id
router.put('/:id', updateLabTest);                      // PUT /api/lab-tests/:id
router.get('/patient/:patientId', getLabTestsByPatient); // GET /api/lab-tests/patient/:patientId

module.exports = router;