const LabTest = require('../models/LabTest');
const User = require('../models/User');

// Get all lab tests
const getAllLabTests = async (req, res) => {
  try {
    const labTests = await LabTest.find()
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .sort({ orderDate: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Lab tests fetched successfully',
      data: labTests
    });
  } catch (error) {
    console.error('Get lab tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Book/Create new lab test
const bookLabTest = async (req, res) => {
  try {
    const { 
      patientId, 
      doctorId, 
      testName, 
      testType, 
      scheduledDate,
      cost = 0
    } = req.body;

    // Validation
    if (!patientId || !doctorId || !testName || !testType) {
      return res.status(400).json({
        success: false,
        message: 'Patient, doctor, test name, and test type are required'
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

    // Create lab test
    const labTest = await LabTest.create({
      patientId,
      doctorId,
      testName,
      testType,
      status: 'ordered',
      orderDate: new Date(),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      cost
    });

    // Populate the created lab test
    const populatedLabTest = await LabTest.findById(labTest._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization');

    res.status(201).json({
      success: true,
      message: 'Lab test booked successfully',
      data: populatedLabTest
    });

  } catch (error) {
    console.error('Book lab test error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get lab test by ID
const getLabTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const labTest = await LabTest.findById(id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization');
    
    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lab test fetched successfully',
      data: labTest
    });
  } catch (error) {
    console.error('Get lab test by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update lab test
const updateLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;

    const labTest = await LabTest.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name email phone')
     .populate('doctorId', 'name specialization');

    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lab test updated successfully',
      data: labTest
    });
  } catch (error) {
    console.error('Update lab test error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get lab tests by patient ID
const getLabTestsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const labTests = await LabTest.find({ patientId })
      .populate('doctorId', 'name specialization')
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      message: 'Patient lab tests fetched successfully',
      data: labTests
    });
  } catch (error) {
    console.error('Get patient lab tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllLabTests,
  bookLabTest,
  getLabTestById,
  updateLabTest,
  getLabTestsByPatient
};