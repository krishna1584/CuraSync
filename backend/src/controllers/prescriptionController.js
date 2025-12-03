const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// Create new prescription
const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentId,
      diagnosis,
      symptoms,
      medications,
      vitalSigns,
      labTests,
      followUpDate,
      notes
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !diagnosis || !medications || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient, doctor, diagnosis, and at least one medication are required'
      });
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create prescription
    const prescription = await Prescription.create({
      patientId,
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

    // Populate the created prescription
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'name email phone patientId')
      .populate('doctorId', 'name email specialization doctorId');

    // Send real-time notification to patient
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    const patientKey = Object.keys(connectedUsers).find(
      key => key === patientId.toString() || key === patientId
    );
    
    if (patientKey && connectedUsers[patientKey]) {
      const notificationData = {
        type: 'new_prescription',
        message: `Dr. ${doctor.name} has prescribed new medication for you`,
        prescription: populatedPrescription,
        timestamp: new Date().toISOString()
      };
      
      io.to(connectedUsers[patientKey].socketId).emit('prescription_notification', notificationData);
    }

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: populatedPrescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all prescriptions for a patient
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name email specialization doctorId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Prescriptions fetched successfully',
      data: prescriptions
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all prescriptions by a doctor
const getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const prescriptions = await Prescription.find({ doctorId })
      .populate('patientId', 'name email phone patientId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Prescriptions fetched successfully',
      data: prescriptions
    });
  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single prescription by ID
const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
      .populate('patientId', 'name email phone patientId dateOfBirth gender bloodGroup allergies chronicConditions')
      .populate('doctorId', 'name email specialization doctorId qualifications');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription fetched successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update prescription
const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const prescription = await Prescription.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email phone patientId')
      .populate('doctorId', 'name email specialization doctorId');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete prescription
const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findByIdAndDelete(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get patient health summary
const getPatientHealthSummary = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Get patient details with health info
    const patient = await User.findById(patientId)
      .select('-password');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get all prescriptions
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get all appointments
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name specialization')
      .sort({ appointmentDate: -1 })
      .limit(10);

    // Compile health summary
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
      statistics: {
        totalPrescriptions: await Prescription.countDocuments({ patientId }),
        totalAppointments: await Appointment.countDocuments({ patientId }),
        activePrescriptions: await Prescription.countDocuments({ patientId, status: 'active' })
      }
    };

    res.status(200).json({
      success: true,
      message: 'Health summary fetched successfully',
      data: healthSummary
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
