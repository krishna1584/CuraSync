const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patientId', 'name email phone patientId')
      .populate('doctorId', 'name email specialization doctorId')
      .sort({ appointmentDate: 1 });
    
    // Transform the data to use 'patient' and 'doctor' fields for frontend consistency
    const transformedAppointments = appointments.map(apt => {
      const aptObj = apt.toObject();
      return {
        _id: aptObj._id,
        patient: aptObj.patientId,
        doctor: aptObj.doctorId,
        date: aptObj.appointmentDate,
        time: aptObj.timeSlot,
        reason: aptObj.reason,
        status: aptObj.status,
        type: aptObj.type,
        notes: aptObj.notes,
        createdAt: aptObj.createdAt,
        updatedAt: aptObj.updatedAt
      };
    });
    
    res.status(200).json({
      success: true,
      message: 'Appointments fetched successfully',
      data: transformedAppointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment fetched successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new appointment
const createAppointment = async (req, res) => {
  try {
    const { 
      patientId, 
      doctorId, 
      appointmentDate, 
      timeSlot, 
      reason, 
      type = 'consultation' 
    } = req.body;

    // Validation
    if (!patientId || !doctorId || !appointmentDate || !timeSlot || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Patient, doctor, date, time slot, and reason are required'
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

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available at this time slot'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      reason,
      type,
      status: 'scheduled'
    });

    // Populate the created appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization');

    // Send real-time notification to doctor
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    console.log('\n=== Notification Debug ===');
    console.log('Connected Users:', Object.keys(connectedUsers).map(id => ({
      id,
      name: connectedUsers[id].name,
      role: connectedUsers[id].role,
      socketId: connectedUsers[id].socketId
    })));
    console.log('Doctor ID to notify:', doctorId.toString());
    console.log('Patient ID to notify:', patientId.toString());
    console.log('========================\n');
    
    // Notify doctor about new appointment
    const doctorKey = Object.keys(connectedUsers).find(
      key => key === doctorId.toString() || key === doctorId
    );
    
    if (doctorKey && connectedUsers[doctorKey]) {
      const notificationMessage = `New appointment booked by ${patient.name} for ${new Date(appointmentDate).toLocaleDateString()} at ${timeSlot}`;
      const notificationData = {
        type: 'new_appointment',
        message: notificationMessage,
        appointment: populatedAppointment,
        timestamp: new Date().toISOString()
      };
      
      console.log('🔔 Sending notification to doctor:');
      console.log('   Name:', connectedUsers[doctorKey].name);
      console.log('   Socket ID:', connectedUsers[doctorKey].socketId);
      console.log('   Data:', notificationData.type, '-', notificationData.message);
      
      io.to(connectedUsers[doctorKey].socketId).emit('appointment_notification', notificationData);
      console.log('✅ Doctor notification sent');
    } else {
      console.log('❌ Doctor not connected. Doctor ID:', doctorId.toString());
      console.log('   Available IDs:', Object.keys(connectedUsers));
    }

    // Send notification to patient as well
    const patientKey = Object.keys(connectedUsers).find(
      key => key === patientId.toString() || key === patientId
    );
    
    if (patientKey && connectedUsers[patientKey]) {
      const patientMessage = `Your appointment with Dr. ${doctor.name} has been confirmed for ${new Date(appointmentDate).toLocaleDateString()} at ${timeSlot}`;
      const notificationData = {
        type: 'appointment_confirmed',
        message: patientMessage,
        appointment: populatedAppointment,
        timestamp: new Date().toISOString()
      };
      
      console.log('🔔 Sending notification to patient:');
      console.log('   Name:', connectedUsers[patientKey].name);
      console.log('   Socket ID:', connectedUsers[patientKey].socketId);
      console.log('   Data:', notificationData.type, '-', notificationData.message);
      
      io.to(connectedUsers[patientKey].socketId).emit('appointment_notification', notificationData);
      console.log('✅ Patient notification sent');
    } else {
      console.log('❌ Patient not connected. Patient ID:', patientId.toString());
      console.log('   Available IDs:', Object.keys(connectedUsers));
    }

    // Broadcast appointment update to all connected admin users
    Object.keys(connectedUsers).forEach(userId => {
      if (connectedUsers[userId].role === 'admin') {
        io.to(connectedUsers[userId].socketId).emit('appointment_update', {
          type: 'appointment_created',
          appointment: populatedAppointment,
          timestamp: new Date().toISOString()
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name email phone')
     .populate('doctorId', 'name specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Send real-time notification for appointment updates
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    // Notify patient about status change
    const patientKey = Object.keys(connectedUsers).find(
      key => key === appointment.patientId._id.toString()
    );
    
    if (patientKey && connectedUsers[patientKey] && updates.status) {
      const statusMessage = `Your appointment status has been updated to: ${updates.status}`;
      io.to(connectedUsers[patientKey].socketId).emit('appointment_notification', {
        type: 'status_update',
        message: statusMessage,
        appointment: appointment,
        timestamp: new Date().toISOString()
      });
    }

    // Notify doctor about updates
    const doctorKey = Object.keys(connectedUsers).find(
      key => key === appointment.doctorId._id.toString()
    );
    
    if (doctorKey && connectedUsers[doctorKey]) {
      io.to(connectedUsers[doctorKey].socketId).emit('appointment_notification', {
        type: 'appointment_updated',
        message: `Appointment with ${appointment.patientId.name} has been updated`,
        appointment: appointment,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findByIdAndDelete(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get appointments by patient ID
const getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name specialization email')
      .populate('patientId', 'name email')
      .sort({ appointmentDate: 1 });

    // Transform the data to use 'patient' and 'doctor' fields for frontend consistency
    const transformedAppointments = appointments.map(apt => {
      const aptObj = apt.toObject();
      return {
        _id: aptObj._id,
        patient: aptObj.patientId,
        doctor: aptObj.doctorId,
        date: aptObj.appointmentDate,
        time: aptObj.timeSlot,
        reason: aptObj.reason,
        status: aptObj.status,
        type: aptObj.type,
        notes: aptObj.notes,
        createdAt: aptObj.createdAt,
        updatedAt: aptObj.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      message: 'Patient appointments fetched successfully',
      data: transformedAppointments
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get appointments by doctor ID
const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email phone')
      .sort({ appointmentDate: 1 });

    res.status(200).json({
      success: true,
      message: 'Doctor appointments fetched successfully',
      data: appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get appointments for the current logged-in doctor
const getMyAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id; // Get doctor ID from authenticated user
    
    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email phone patientId')
      .populate('doctorId', 'name email specialization doctorId')
      .sort({ appointmentDate: 1 });

    // Transform the data to use 'patient' and 'doctor' fields for frontend consistency
    const transformedAppointments = appointments.map(apt => {
      const aptObj = apt.toObject();
      return {
        _id: aptObj._id,
        patient: aptObj.patientId,
        doctor: aptObj.doctorId,
        date: aptObj.appointmentDate,
        time: aptObj.timeSlot,
        reason: aptObj.reason,
        status: aptObj.status,
        type: aptObj.type,
        notes: aptObj.notes,
        createdAt: aptObj.createdAt,
        updatedAt: aptObj.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      message: 'Your appointments fetched successfully',
      data: transformedAppointments
    });
  } catch (error) {
    console.error('Get my appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getMyAppointments
};