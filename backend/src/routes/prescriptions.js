const express = require('express');
const {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  getPatientHealthSummary
} = require('../controllers/prescriptionController');

const router = express.Router();

// Prescription routes
router.post('/', createPrescription);                                    // POST /api/prescriptions
router.get('/patient/:patientId', getPatientPrescriptions);              // GET /api/prescriptions/patient/:patientId
router.get('/doctor/:doctorId', getDoctorPrescriptions);                 // GET /api/prescriptions/doctor/:doctorId
router.get('/health-summary/:patientId', getPatientHealthSummary);       // GET /api/prescriptions/health-summary/:patientId
router.get('/:id', getPrescriptionById);                                 // GET /api/prescriptions/:id
router.put('/:id', updatePrescription);                                  // PUT /api/prescriptions/:id
router.delete('/:id', deletePrescription);                               // DELETE /api/prescriptions/:id

module.exports = router;
