const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
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
  testName: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    enum: ['blood', 'urine', 'imaging', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['ordered', 'sample-collected', 'in-progress', 'completed', 'cancelled'],
    default: 'ordered'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: Date,
  completedDate: Date,
  results: {
    parameters: [{
      name: String,
      value: String,
      normalRange: String,
      status: {
        type: String,
        enum: ['normal', 'abnormal', 'critical']
      }
    }],
    interpretation: String,
    reportUrl: String
  },
  cost: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
labTestSchema.index({ patientId: 1, orderDate: 1 });
labTestSchema.index({ doctorId: 1, orderDate: 1 });

const LabTest = mongoose.models.LabTest || mongoose.model('LabTest', labTestSchema);
module.exports = LabTest;