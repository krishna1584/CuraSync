const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency'],
    default: 'consultation'
  },
  reason: {
    type: String,
    required: true
  },
  notes: String,
  prescription: String
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });

// A doctor can have only one scheduled appointment per day and time slot.
// Cancelled/completed appointments do not block the slot.
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: 'scheduled' }, name: 'unique_scheduled_slot' }
);

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;