const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const {
  isHospitalStaff,
  sameId,
  doctorCanAccessPatient,
  canAccessPatientData,
  pick,
  errorDetails
} = require('../utils/access');

// Fields the prescribing doctor may change after creation.
const UPDATABLE_FIELDS = [
  'diagnosis', 'symptoms', 'medications', 'vitalSigns',
  'labTests', 'followUpDate', 'notes', 'status'
];

const refId = (ref) => (ref && ref._id ? ref._id : ref);

const canViewPrescription = (prescription, user) => (
  isHospitalStaff(user.role) ||
  sameId(refId(prescription.patientId), user._id) ||
  sameId(refId(prescription.doctorId), user._id)
);

const serverError = (res, label, error) => {
  console.error(`${label} error:`, error);
  return res.status(500).json({ success: false, message: 'Internal server error', ...errorDetails(error) });
};

// POST /api/prescriptions — doctors only, for their own patients
const createPrescription = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can create prescriptions' });
    }

    const {
      patientId,
      appointmentId,
      diagnosis,
      symptoms,
      medications,
      vitalSigns,
      labTests,
      followUpDate,
      notes
    } = req.body;

    // The prescribing doctor is always the signed-in doctor.
    const doctorId = req.user._id;

    if (!patientId || !diagnosis || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient, diagnosis, and at least one medication are required'
      });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (!(await doctorCanAccessPatient(doctorId, patient._id))) {
      return res.status(403).json({
        success: false,
        message: 'You can only prescribe for patients who have an appointment with you'
      });
    }

    if (appointmentId && !(await Appointment.exists({ _id: appointmentId, doctorId, patientId: patient._id }))) {
      return res.status(400).json({ success: false, message: 'Appointment does not match this patient' });
    }

    const prescription = await Prescription.create({
      patientId: patient._id,
      doctorId,
      appointmentId,
      diagnosis,
      symptoms,
      medications,
      vitalSigns,
      labTests,
      followUpDate,
      notes,
      status: 'active'
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'name email phone patientId')
      .populate('doctorId', 'name email specialization doctorId');

    // Real-time notification to the patient
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers') || {};
    const connection = connectedUsers[patient._id.toString()];

    if (io && connection) {
      io.to(connection.socketId).emit('prescription_notification', {
        type: 'new_prescription',
        message: `Dr. ${req.user.name} has prescribed new medication for you`,
        prescription: populatedPrescription,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: populatedPrescription
    });
  } catch (error) {
    return serverError(res, 'Create prescription', error);
  }
};

// GET /api/prescriptions/patient/:patientId
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!(await canAccessPatientData(req.user, patientId))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name email specialization doctorId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: 'Prescriptions fetched successfully', data: prescriptions });
  } catch (error) {
    return serverError(res, 'Get patient prescriptions', error);
  }
};

// GET /api/prescriptions/doctor/:doctorId — that doctor or staff
const getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!isHospitalStaff(req.user.role) && !sameId(req.user._id, doctorId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const prescriptions = await Prescription.find({ doctorId })
      .populate('patientId', 'name email phone patientId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: 'Prescriptions fetched successfully', data: prescriptions });
  } catch (error) {
    return serverError(res, 'Get doctor prescriptions', error);
  }
};

// GET /api/prescriptions/:id
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone patientId dateOfBirth gender bloodGroup allergies chronicConditions')
      .populate('doctorId', 'name email specialization doctorId qualifications');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (!canViewPrescription(prescription, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, message: 'Prescription fetched successfully', data: prescription });
  } catch (error) {
    return serverError(res, 'Get prescription', error);
  }
};

// PUT /api/prescriptions/:id — prescribing doctor only
const updatePrescription = async (req, res) => {
  try {
    const existing = await Prescription.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (req.user.role !== 'doctor' || !sameId(existing.doctorId, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the prescribing doctor can update this prescription' });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      pick(req.body, UPDATABLE_FIELDS),
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email phone patientId')
      .populate('doctorId', 'name email specialization doctorId');

    res.status(200).json({ success: true, message: 'Prescription updated successfully', data: prescription });
  } catch (error) {
    return serverError(res, 'Update prescription', error);
  }
};

// DELETE /api/prescriptions/:id — prescribing doctor or admin
const deletePrescription = async (req, res) => {
  try {
    const existing = await Prescription.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const isOwner = req.user.role === 'doctor' && sameId(existing.doctorId, req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await existing.deleteOne();

    res.status(200).json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error) {
    return serverError(res, 'Delete prescription', error);
  }
};

// GET /api/prescriptions/health-summary/:patientId
const getPatientHealthSummary = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!(await canAccessPatientData(req.user, patientId))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const patient = await User.findById(patientId).select('-password');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const [prescriptions, appointments, totalPrescriptions, totalAppointments, activePrescriptions] = await Promise.all([
      Prescription.find({ patientId })
        .populate('doctorId', 'name specialization')
        .sort({ createdAt: -1 })
        .limit(10),
      Appointment.find({ patientId })
        .populate('doctorId', 'name specialization')
        .sort({ appointmentDate: -1 })
        .limit(10),
      Prescription.countDocuments({ patientId }),
      Appointment.countDocuments({ patientId }),
      Prescription.countDocuments({ patientId, status: 'active' })
    ]);

    const healthSummary = {
      patient: {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        patientId: patient.patientId,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        emergencyContact: patient.emergencyContact
      },
      recentPrescriptions: prescriptions,
      recentAppointments: appointments,
      statistics: { totalPrescriptions, totalAppointments, activePrescriptions }
    };

    res.status(200).json({ success: true, message: 'Health summary fetched successfully', data: healthSummary });
  } catch (error) {
    return serverError(res, 'Get health summary', error);
  }
};

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  getPatientHealthSummary
};
