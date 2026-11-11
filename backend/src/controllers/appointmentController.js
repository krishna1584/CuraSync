const Appointment = require('../models/Appointment');
const User = require('../models/User');

const Settings = require('../models/Settings');
const { isHospitalStaff, pick, errorDetails } = require('../utils/access');
const { toDayStart, dayRange, isPastDay, slotsForDoctor, bookedSlots } = require('../utils/scheduling');
const { isEmailConfigured, sendEmail, escapeHtml } = require('../utils/email');

const APPOINTMENT_EMAIL_SUBJECTS = {
  booked: 'Your appointment is booked',
  cancelled: 'Your appointment was cancelled',
  completed: 'Your appointment is complete',
  'no-show': 'You missed your appointment'
};

// Email the patient about their appointment when the admin turned appointment emails on.
// Runs in the background and never blocks or fails the request.
const emailPatientAboutAppointment = (patient, doctor, appointment, event) => {
  if (!patient || !patient.email || !APPOINTMENT_EMAIL_SUBJECTS[event] || !isEmailConfigured()) return;
  // Respect the patient's own opt-out.
  if (patient.notificationPreferences && patient.notificationPreferences.appointmentEmails === false) return;

  (async () => {
    const settings = await Settings.getGlobal();
    if (!settings.emailNotifications) return;

    const when = `${new Date(appointment.appointmentDate).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })} at ${appointment.timeSlot}`;
    const doctorName = doctor && doctor.name ? `Dr. ${doctor.name}` : 'your doctor';
    const lines = {
      booked: `Your appointment with ${doctorName} is booked for ${when}.`,
      cancelled: `Your appointment with ${doctorName} on ${when} has been cancelled.`,
      completed: `Your appointment with ${doctorName} on ${when} is marked as complete.`,
      'no-show': `Your appointment with ${doctorName} on ${when} was marked as missed. Please book again if you still need to be seen.`
    };
    const hospital = settings.hospitalName || 'CuraSync';

    await sendEmail({
      to: patient.email,
      subject: `${APPOINTMENT_EMAIL_SUBJECTS[event]} – ${hospital}`,
      text: `Hello ${patient.name || ''},\n\n${lines[event]}\n\n${hospital}`,
      html: `<p>Hello ${escapeHtml(patient.name || '')},</p><p>${escapeHtml(lines[event])}</p><p>${escapeHtml(hospital)}</p>`
    });
  })().catch((error) => console.error('Appointment email failed:', error.message));
};

// GET /api/appointments/available-slots?doctorId=...&date=YYYY-MM-DD
// Returns every offered slot with whether it can still be booked (no patient details).
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const dayStart = toDayStart(date);

    if (!doctorId || !dayStart) {
      return res.status(400).json({ success: false, message: 'doctorId and date (YYYY-MM-DD) are required' });
    }

    const doctor = await User.findById(doctorId).select('role availability');
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const { slots, reason } = slotsForDoctor(doctor, dayStart);
    const taken = new Set(await bookedSlots(doctor._id, dayStart));

    res.status(200).json({
      success: true,
      data: {
        date: dayStart.toISOString().slice(0, 10),
        reason: reason || null,
        slots: slots.map((time) => ({ time, available: !taken.has(time) }))
      }
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', ...errorDetails(error) });
  }
};

// Fields each role may change on an existing appointment.
const DOCTOR_UPDATABLE_FIELDS = ['status', 'notes', 'prescription'];
const STAFF_UPDATABLE_FIELDS = ['status', 'notes', 'appointmentDate', 'timeSlot', 'type', 'reason', 'doctorId'];

const canAccessAppointment = (appointment, user) => {
  if (isHospitalStaff(user.role)) return true;
  return appointment.patientId._id?.toString() === user._id.toString() ||
    appointment.patientId.toString() === user._id.toString() ||
    appointment.doctorId._id?.toString() === user._id.toString() ||
    appointment.doctorId.toString() === user._id.toString();
};

// Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    const query = isHospitalStaff(req.user.role)
      ? {}
      : req.user.role === 'doctor'
        ? { doctorId: req.user._id }
        : { patientId: req.user._id };

    const appointments = await Appointment.find(query)
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
      ...errorDetails(error)
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

    if (!canAccessAppointment(appointment, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
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
      ...errorDetails(error)
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

    if (req.user.role === 'patient' && req.user._id.toString() !== patientId.toString()) {
      return res.status(403).json({ success: false, message: 'Patients can only book appointments for themselves' });
    }

    if (req.user.role === 'doctor' && req.user._id.toString() !== doctorId.toString()) {
      return res.status(403).json({ success: false, message: 'Doctors can only create their own appointments' });
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

    const dayStart = toDayStart(appointmentDate);
    if (!dayStart || isPastDay(dayStart)) {
      return res.status(400).json({ success: false, message: 'Please choose a valid future date' });
    }

    // The slot must be one the doctor actually offers that day...
    const { slots, reason: unavailableReason } = slotsForDoctor(doctor, dayStart);
    if (!slots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: unavailableReason || 'The doctor is not available at this time'
      });
    }

    // ...and not already booked by someone else (same calendar day, same slot).
    const taken = await bookedSlots(doctor._id, dayStart);
    if (taken.includes(timeSlot)) {
      return res.status(409).json({
        success: false,
        message: 'This time slot was just booked. Please pick another one.'
      });
    }

    // Patients can't hold two appointments at the same time.
    const patientClash = await Appointment.exists({
      patientId: patient._id,
      appointmentDate: dayRange(dayStart),
      timeSlot,
      status: 'scheduled'
    });
    if (patientClash) {
      return res.status(409).json({
        success: false,
        message: 'You already have an appointment at this time'
      });
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate: dayStart,
        timeSlot,
        reason,
        type,
        status: 'scheduled'
      });
    } catch (createError) {
      // The unique index catches two bookings racing for the same slot.
      if (createError && createError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This time slot was just booked. Please pick another one.'
        });
      }
      throw createError;
    }

    emailPatientAboutAppointment(patient, doctor, appointment, 'booked');

    // Populate the created appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization');

    // Send real-time notification to doctor
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
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
      
      io.to(connectedUsers[doctorKey].socketId).emit('appointment_notification', notificationData);
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
      
      io.to(connectedUsers[patientKey].socketId).emit('appointment_notification', notificationData);
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
      ...errorDetails(error)
    });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const existingAppointment = await Appointment.findById(id);

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!canAccessAppointment(existingAppointment, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Each role may only change specific fields.
    let updates;
    if (req.user.role === 'patient') {
      if (req.body.status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Patients can only cancel appointments' });
      }
      updates = { status: 'cancelled' };
    } else if (req.user.role === 'doctor') {
      updates = pick(req.body, DOCTOR_UPDATABLE_FIELDS);
    } else {
      updates = pick(req.body, STAFF_UPDATABLE_FIELDS);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided' });
    }

    if (updates.status && existingAppointment.status !== 'scheduled' && updates.status !== existingAppointment.status) {
      return res.status(400).json({
        success: false,
        message: `This appointment is already ${existingAppointment.status}`
      });
    }

    // Rescheduling (staff): validate the new doctor/date/slot like a new booking.
    if (updates.doctorId || updates.appointmentDate || updates.timeSlot) {
      const doctor = await User.findById(updates.doctorId || existingAppointment.doctorId);
      if (!doctor || doctor.role !== 'doctor') {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }
      const dayStart = toDayStart(updates.appointmentDate || existingAppointment.appointmentDate);
      if (!dayStart) {
        return res.status(400).json({ success: false, message: 'Invalid date' });
      }
      const timeSlot = updates.timeSlot || existingAppointment.timeSlot;
      const { slots, reason: unavailableReason } = slotsForDoctor(doctor, dayStart);
      if (!slots.includes(timeSlot)) {
        return res.status(400).json({ success: false, message: unavailableReason || 'The doctor is not available at this time' });
      }
      const taken = await bookedSlots(doctor._id, dayStart, existingAppointment._id);
      if (taken.includes(timeSlot)) {
        return res.status(409).json({ success: false, message: 'That time slot is already booked' });
      }
      updates.appointmentDate = dayStart;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name email phone notificationPreferences')
     .populate('doctorId', 'name specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (updates.status && updates.status !== existingAppointment.status) {
      emailPatientAboutAppointment(appointment.patientId, appointment.doctorId, appointment, updates.status);
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
      ...errorDetails(error)
    });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!canAccessAppointment(appointment, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...errorDetails(error)
    });
  }
};

// Get appointments by patient ID
const getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.user.role === 'doctor' && !(await Appointment.exists({ patientId, doctorId: req.user._id }))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
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
      ...errorDetails(error)
    });
  }
};

// Get appointments by doctor ID
const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (req.user.role === 'doctor' && req.user._id.toString() !== doctorId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.user.role === 'patient' && !(await Appointment.exists({ patientId: req.user._id, doctorId }))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
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
      ...errorDetails(error)
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
      ...errorDetails(error)
    });
  }
};

module.exports = {
  getAvailableSlots,
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getMyAppointments
};