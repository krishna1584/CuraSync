const Appointment = require('../models/Appointment');

const STAFF_ROLES = ['admin', 'nurse', 'receptionist'];

const isHospitalStaff = (role) => STAFF_ROLES.includes(role);

const sameId = (a, b) => Boolean(a && b) && a.toString() === b.toString();

// A doctor may access a patient's data only if they have at least one appointment together.
const doctorCanAccessPatient = async (doctorId, patientId) => (
  Boolean(await Appointment.exists({ doctorId, patientId }))
);

// Can `user` read clinical data belonging to `patientId`?
const canAccessPatientData = async (user, patientId) => {
  if (isHospitalStaff(user.role)) return true;
  if (user.role === 'patient') return sameId(user._id, patientId);
  if (user.role === 'doctor') return doctorCanAccessPatient(user._id, patientId);
  return false;
};

// Express middleware: allow only the given roles.
const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

// Copy only whitelisted keys from `source`.
const pick = (source = {}, keys = []) => keys.reduce((acc, key) => {
  if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
    acc[key] = source[key];
  }
  return acc;
}, {});

// Include internal error details only outside production.
const errorDetails = (error) => (
  process.env.NODE_ENV === 'production' ? {} : { error: error && error.message }
);

module.exports = {
  STAFF_ROLES,
  isHospitalStaff,
  sameId,
  doctorCanAccessPatient,
  canAccessPatientData,
  requireRoles,
  pick,
  errorDetails
};
