const express = require('express');
const { 
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getMyAppointments
} = require('../controllers/appointmentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// Appointment routes
router.get('/', getAllAppointments);                    // GET /api/appointments
router.post('/', createAppointment);                    // POST /api/appointments
router.get('/my-appointments', getMyAppointments);      // GET /api/appointments/my-appointments
router.get('/:id', getAppointmentById);                 // GET /api/appointments/:id
router.put('/:id', updateAppointment);                  // PUT /api/appointments/:id
router.delete('/:id', deleteAppointment);               // DELETE /api/appointments/:id
router.get('/patient/:patientId', getAppointmentsByPatient); // GET /api/appointments/patient/:patientId
router.get('/doctor/:doctorId', getAppointmentsByDoctor);    // GET /api/appointments/doctor/:doctorId

module.exports = router;