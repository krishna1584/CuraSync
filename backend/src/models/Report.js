const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Patient Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },

  // Report Details
  reportType: {
    type: String,
    required: true,
    enum: [
      'Blood Test',
      'Urine Test',
      'X-Ray',
      'MRI',
      'CT Scan',
      'Ultrasound',
      'ECG',
      'Pathology',
      'Other'
    ]
  },
  
  reportTitle: {
    type: String,
    required: true
  },

  // File Storage
  cloudinaryUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },

  // AI Extracted Data
  extractedData: {
    type: Map,
    of: String,
    default: {}
  },
  
  // Common Health Metrics (structured for easy querying)
  metrics: {
    hemoglobin: String,
    bloodSugar: String,
    cholesterol: String,
    bloodPressure: String,
    heartRate: String,
    temperature: String,
    weight: String,
    height: String,
    bmi: String,
    // Add more as needed
  },

  // Test Date
  testDate: {
    type: Date,
    required: true
  },

  // Upload Information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByRole: {
    type: String,
    enum: ['patient', 'doctor', 'nurse', 'admin', 'receptionist'],
    required: true
  },

  // AI Processing Status
  aiProcessed: {
    type: Boolean,
    default: false
  },
  aiProcessingError: {
    type: String
  },

  // Additional Information
  notes: {
    type: String
  },
  summary: {
    type: String
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'processed', 'reviewed', 'archived'],
    default: 'pending'
  },

  // Review by doctor
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String
  }

}, {
  timestamps: true
});

// Indexes for faster queries
reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ patientId: 1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ testDate: -1 });
reportSchema.index({ status: 1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

module.exports = Report;
