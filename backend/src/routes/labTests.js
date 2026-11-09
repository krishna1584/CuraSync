const express = require('express');
const {
  getAllLabTests,
  bookLabTest,
  getLabTestById,
  updateLabTest,
  getLabTestsByPatient
} = require('../controllers/labTestController');
const auth = require('../middleware/auth');

const router = express.Router();

// All lab test routes require a signed-in user; per-record checks live in the controller.
router.use(auth);

router.get('/', getAllLabTests);                        // GET /api/lab-tests
router.post('/book', bookLabTest);                      // POST /api/lab-tests/book
router.get('/patient/:patientId', getLabTestsByPatient); // GET /api/lab-tests/patient/:patientId
router.get('/:id', getLabTestById);                     // GET /api/lab-tests/:id
router.put('/:id', updateLabTest);                      // PUT /api/lab-tests/:id

module.exports = router;
