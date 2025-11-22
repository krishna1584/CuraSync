const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'nurse', 'admin', 'receptionist'],
    default: 'patient'
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Patient specific fields
  patientId: {
    type: String,
    unique: true,
    sparse: true // Only unique if not null
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  allergies: [String],
  chronicConditions: [String],
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    validUntil: Date
  },
  
  // Doctor specific fields
  doctorId: {
    type: String,
    unique: true,
    sparse: true
  },
  specialization: String,
  licenseNumber: String,
  qualifications: [String],
  experience: Number,
  consultationFee: Number,
  availability: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  department: String,
  
  // Staff specific fields (nurse, receptionist)
  staffId: {
    type: String,
    unique: true,
    sparse: true
  },
  shiftSchedule: [{
    day: String,
    startTime: String,
    endTime: String
  }]
}, {
  timestamps: true
});

// Pre-save middleware to generate IDs based on role
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const UserModel = this.constructor;
      
      if (this.role === 'patient' && !this.patientId) {
        const count = await UserModel.countDocuments({ role: 'patient' });
        this.patientId = `PAT${String(count + 1).padStart(6, '0')}`;
      } else if (this.role === 'doctor' && !this.doctorId) {
        const count = await UserModel.countDocuments({ role: 'doctor' });
        this.doctorId = `DOC${String(count + 1).padStart(6, '0')}`;
      } else if (['nurse', 'receptionist', 'admin'].includes(this.role) && !this.staffId) {
        const count = await UserModel.countDocuments({ role: { $in: ['nurse', 'receptionist', 'admin'] } });
        this.staffId = `STF${String(count + 1).padStart(6, '0')}`;
      }
    } catch (error) {
      console.error('Error in pre-save middleware:', error);
    }
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;