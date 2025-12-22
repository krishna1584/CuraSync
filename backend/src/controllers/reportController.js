const multer = require('multer');
const Report = require('../models/Report');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { extractMedicalData, structureExtractedData } = require('../utils/geminiService');

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = file.mimetype.includes('image') || file.mimetype.includes('pdf');

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

/**
 * Upload report with automatic AI data extraction
 */
const uploadReport = async (req, res) => {
  try {
    const { patientId, reportType, reportTitle, testDate, notes } = req.body;
    const uploadedBy = req.user._id;
    const uploadedByRole = req.user.role;
    
    // Validation
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!patientId || !reportType || !reportTitle || !testDate) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, report type, title, and test date are required'
      });
    }

    // Find patient
    const patient = await User.findOne({ 
      $or: [{ _id: patientId }, { patientId: patientId }] 
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'medical-reports'
    );

    console.log('Cloudinary upload successful:', cloudinaryResult.secure_url);

    // Create initial report entry
    const report = new Report({
      patient: patient._id,
      patientId: patient.patientId,
      patientName: patient.name,
      reportType,
      reportTitle,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      testDate: new Date(testDate),
      uploadedBy,
      uploadedByRole,
      notes: notes || '',
      status: 'pending'
    });

    await report.save();

    // Extract data using AI in background (don't wait for it)
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    extractDataInBackground(report._id, cloudinaryResult.secure_url, reportType, io, connectedUsers);

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully. AI extraction in progress...',
      data: report
    });

  } catch (error) {
    console.error('Upload report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload report',
      error: error.message
    });
  }
};

/**
 * Background AI extraction (async)
 */
const extractDataInBackground = async (reportId, cloudinaryUrl, reportType, io = null, connectedUsers = null) => {
  try {
    console.log('Starting AI extraction for report:', reportId);
    
    // Extract data using Gemini AI
    const extractionResult = await extractMedicalData(cloudinaryUrl, reportType);
    
    if (extractionResult.success) {
      // Structure the data
      const { structured, metrics } = structureExtractedData(
        extractionResult.data,
        reportType
      );

      // Update report with extracted data
      const updatedReport = await Report.findByIdAndUpdate(reportId, {
        extractedData: structured,
        metrics: metrics,
        aiProcessed: true,
        status: 'processed',
        summary: extractionResult.data.notes || extractionResult.data.impression || ''
      }, { new: true }).populate('patient', 'name email patientId');

      console.log('AI extraction completed for report:', reportId);
      
      // Notify patient via Socket.IO
      try {
        if (io && connectedUsers && updatedReport) {
          const patientId = updatedReport.patient._id.toString();
          const userConnection = connectedUsers[patientId];
          
          if (userConnection) {
            console.log(`📤 Sending report_processed notification to ${updatedReport.patient.name}`);
            io.to(userConnection.socketId).emit('report_processed', {
              reportId: updatedReport._id,
              reportTitle: updatedReport.reportTitle,
              reportType: updatedReport.reportType,
              metrics: updatedReport.metrics,
              message: `Your ${updatedReport.reportType} report has been processed`,
              timestamp: new Date().toISOString()
            });
          } else {
            console.log(`📭 Patient ${updatedReport.patient.name} not connected to receive notification`);
          }
        }
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
        // Don't fail the entire process if socket notification fails
      }
    } else {
      // Update with error
      await Report.findByIdAndUpdate(reportId, {
        aiProcessed: false,
        aiProcessingError: extractionResult.error
      });
      
      console.error('AI extraction failed:', extractionResult.error);
    }
  } catch (error) {
    console.error('Background extraction error:', error);
    await Report.findByIdAndUpdate(reportId, {
      aiProcessed: false,
      aiProcessingError: error.message
    });
  }
};

/**
 * Get all reports (with filters)
 */
const getAllReports = async (req, res) => {
  try {
    const { patientId, reportType, status, startDate, endDate } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Build query
    let query = {};

    // Role-based filtering
    if (userRole === 'patient') {
      // Patients can only see their own reports
      query.patient = userId;
    } else if (patientId) {
      // Doctors/staff can filter by patient
      const patient = await User.findOne({ 
        $or: [{ _id: patientId }, { patientId: patientId }] 
      });
      if (patient) {
        query.patient = patient._id;
      }
    }

    // Additional filters
    if (reportType) query.reportType = reportType;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.testDate = {};
      if (startDate) query.testDate.$gte = new Date(startDate);
      if (endDate) query.testDate.$lte = new Date(endDate);
    }

    const reports = await Report.find(query)
      .populate('patient', 'name email patientId')
      .populate('uploadedBy', 'name role')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

/**
 * Get single report by ID
 */
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const report = await Report.findById(id)
      .populate('patient', 'name email patientId phone dateOfBirth gender')
      .populate('uploadedBy', 'name role')
      .populate('reviewedBy', 'name role');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Authorization check
    if (userRole === 'patient' && report.patient._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
};

/**
 * Get patient reports (for patient dashboard)
 */
const getMyReports = async (req, res) => {
  try {
    const userId = req.user._id;

    const reports = await Report.find({ patient: userId })
      .populate('uploadedBy', 'name role')
      .populate('reviewedBy', 'name role')
      .sort({ testDate: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });

  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

/**
 * Delete report
 */
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Only admins and doctors can delete reports
    if (!['admin', 'doctor'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(report.cloudinaryPublicId, 'raw');
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue even if Cloudinary delete fails
    }

    // Delete from database
    await Report.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message
    });
  }
};

/**
 * Update report (add review notes)
 */
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes, status } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Only doctors can review reports
    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can review reports'
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update report
    report.reviewNotes = reviewNotes || report.reviewNotes;
    report.status = status || report.status;
    report.reviewedBy = userId;
    report.reviewDate = new Date();

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report',
      error: error.message
    });
  }
};

/**
 * Get report statistics
 */
const getReportStats = async (req, res) => {
  try {
    const { patientId } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};

    if (userRole === 'patient') {
      query.patient = userId;
    } else if (patientId) {
      const patient = await User.findOne({ 
        $or: [{ _id: patientId }, { patientId: patientId }] 
      });
      if (patient) {
        query.patient = patient._id;
      }
    }

    const stats = await Report.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReports = await Report.countDocuments(query);
    const processedReports = await Report.countDocuments({ ...query, aiProcessed: true });
    const pendingReports = await Report.countDocuments({ ...query, status: 'pending' });

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        processedReports,
        pendingReports,
        reportsByType: stats
      }
    });

  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadReport,
  getAllReports,
  getReportById,
  getMyReports,
  deleteReport,
  updateReport,
  getReportStats
};