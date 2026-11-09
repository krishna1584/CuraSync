const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { hashPassword } = require('../utils/auth');
const {
  isHospitalStaff,
  sameId,
  doctorCanAccessPatient,
  pick,
  errorDetails
} = require('../utils/access');

// Profile fields any user may change on their own account.
const COMMON_SELF_FIELDS = ['name', 'phone', 'dateOfBirth', 'gender', 'address', 'profileImage', 'notificationPreferences'];
const PATIENT_SELF_FIELDS = ['emergencyContact', 'bloodGroup', 'allergies', 'chronicConditions', 'insuranceInfo'];
const DOCTOR_SELF_FIELDS = [
  'specialization', 'licenseNumber', 'qualifications', 'experience',
  'consultationFee', 'availability', 'department'
];
const STAFF_SELF_FIELDS = ['department', 'shiftSchedule'];

// Extra fields only an admin may change on someone else's account.
const ADMIN_ONLY_FIELDS = ['email', 'role', 'isVerified'];

const VALID_ROLES = ['patient', 'doctor', 'nurse', 'admin', 'receptionist'];

// Fields safe to show any signed-in user about a doctor.
const PUBLIC_DOCTOR_FIELDS = 'name specialization department qualifications experience consultationFee availability doctorId profileImage';

const selfEditableFields = (role) => {
  if (role === 'patient') return [...COMMON_SELF_FIELDS, ...PATIENT_SELF_FIELDS];
  if (role === 'doctor') return [...COMMON_SELF_FIELDS, ...DOCTOR_SELF_FIELDS];
  return [...COMMON_SELF_FIELDS, ...STAFF_SELF_FIELDS];
};

const serverError = (res, label, error) => {
  console.error(`${label} error:`, error);
  return res.status(500).json({ success: false, message: 'Internal server error', ...errorDetails(error) });
};

// GET /api/users — hospital staff only
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, message: 'Users fetched successfully', data: users });
  } catch (error) {
    return serverError(res, 'Get users', error);
  }
};

// POST /api/users — admin creates doctor/staff/patient accounts
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'patient' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (role === 'doctor' && (!String(req.body.specialization || '').trim() || !String(req.body.licenseNumber || '').trim())) {
      return res.status(400).json({ success: false, message: 'Specialization and license number are required for doctors' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const profile = pick(req.body, selfEditableFields(role));
    const user = await User.create({
      ...profile,
      name,
      email: normalizedEmail,
      password: await hashPassword(password),
      role,
      isVerified: true
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: 'User created successfully', data: userResponse });
  } catch (error) {
    return serverError(res, 'Create user', error);
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id).select('-password');

    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const requester = req.user;

    if (sameId(requester._id, target._id) || isHospitalStaff(requester.role)) {
      return res.status(200).json({ success: true, message: 'User fetched successfully', data: target });
    }

    // Anyone signed in may see a doctor's public profile.
    if (target.role === 'doctor') {
      const publicDoctor = await User.findById(id).select(PUBLIC_DOCTOR_FIELDS);
      return res.status(200).json({ success: true, message: 'User fetched successfully', data: publicDoctor });
    }

    // Doctors may see patients they have an appointment with.
    if (requester.role === 'doctor' && target.role === 'patient' &&
        await doctorCanAccessPatient(requester._id, target._id)) {
      return res.status(200).json({ success: true, message: 'User fetched successfully', data: target });
    }

    return res.status(403).json({ success: false, message: 'Access denied' });
  } catch (error) {
    return serverError(res, 'Get user by ID', error);
  }
};

// GET /api/users/patients — staff get everyone, doctors get only their own patients
const getPatients = async (req, res) => {
  try {
    const query = { role: 'patient' };

    if (req.user.role === 'doctor') {
      query._id = { $in: await Appointment.distinct('patientId', { doctorId: req.user._id }) };
    } else if (!isHospitalStaff(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const patients = await User.find(query).select('-password');
    res.status(200).json({ success: true, message: 'Patients fetched successfully', data: patients });
  } catch (error) {
    return serverError(res, 'Get patients', error);
  }
};

// GET /api/users/doctors — any signed-in user; staff see full records, others see public fields
const getDoctors = async (req, res) => {
  try {
    const projection = isHospitalStaff(req.user.role) ? '-password' : PUBLIC_DOCTOR_FIELDS;
    const doctors = await User.find({ role: 'doctor' }).select(projection);
    res.status(200).json({ success: true, message: 'Doctors fetched successfully', data: doctors });
  } catch (error) {
    return serverError(res, 'Get doctors', error);
  }
};

// PUT /api/users/:id — users edit their own profile; admins can edit anyone
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    const isSelf = sameId(req.user._id, id);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'You can only update your own account' });
    }

    const target = isSelf ? req.user : await User.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let allowed = selfEditableFields(target.role);
    if (isAdmin && !isSelf) allowed = [...allowed, ...ADMIN_ONLY_FIELDS];

    const updates = pick(req.body, allowed);

    if (updates.role && !VALID_ROLES.includes(updates.role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (updates.email) updates.email = String(updates.email).toLowerCase().trim();

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .select('-password');

    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    return serverError(res, 'Update user', error);
  }
};

// DELETE /api/users/:id — admin only
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (sameId(req.user._id, id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return serverError(res, 'Delete user', error);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  getPatients,
  getDoctors,
  updateUser,
  deleteUser
};
