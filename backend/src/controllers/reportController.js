const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const Report = require('../models/Report');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary, getSignedFileUrl } = require('../config/cloudinary');
const { extractMedicalData, structureExtractedData } = require('../utils/geminiService');

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// The only file types the app can store, show and read with AI.
const ALLOWED_UPLOADS = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

const UNSUPPORTED_FILE_MESSAGE = 'Only PDF, JPG and PNG files are allowed';
const badUpload = (message) => Object.assign(new Error(message), { statusCode: 400 });

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const extensions = ALLOWED_UPLOADS[file.mimetype];
    if (extensions && extensions.includes(extension)) {
      return cb(null, true);
    }
    cb(badUpload(UNSUPPORTED_FILE_MESSAGE));
  }
});

// Work out the real file type from its first bytes; the name and browser type can be wrong.
const detectFileType = (buffer) => {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 1024).includes('%PDF-')) return 'application/pdf';
  return null;
};

// Accepts either the database _id or the readable patient number (PAT000001).
const findPatientByAnyId = (id) => {
  const value = String(id);
  const matchers = [{ patientId: value }];
  if (mongoose.isValidObjectId(value)) matchers.push({ _id: value });
  return User.findOne({ role: 'patient', $or: matchers });
};

const { isHospitalStaff, doctorCanAccessPatient, errorDetails } = require('../utils/access');

const reportIsAccessible = async (report, user) => {
  if (isHospitalStaff(user.role)) return true;
  const patientId = report.patient._id || report.patient;
  if (user.role === 'patient') return patientId.toString() === user._id.toString();
  return user.role === 'doctor' && await doctorCanAccessPatient(user._id, patientId);
};

/**
 * Upload report with automatic AI data extraction
 */
const uploadReport = async (req, res) => {
  try {
    const { patientId, reportType, testDate, notes } = req.body;
    const reportTitle = String(req.body.reportTitle || '').trim();
    const uploadedBy = req.user._id;
    const uploadedByRole = req.user.role;

    // Everything is checked first so a rejected upload never reaches Cloudinary.
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!patientId || !reportType || !reportTitle || !testDate) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, report type, title, and test date are required'
      });
    }

    if (!Report.schema.path('reportType').enumValues.includes(reportType)) {
      return res.status(400).json({ success: false, message: 'Please choose a valid report type' });
    }

    if (reportTitle.length > 200) {
      return res.status(400).json({ success: false, message: 'Report title must be 200 characters or fewer' });
    }

    const parsedTestDate = new Date(testDate);
    // One day of slack covers time zones ahead of the server.
    if (Number.isNaN(parsedTestDate.getTime()) || parsedTestDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'Please enter a valid test date that is not in the future' });
    }

    const detectedType = detectFileType(req.file.buffer);
    const extension = path.extname(req.file.originalname).toLowerCase();
    if (!detectedType || !ALLOWED_UPLOADS[detectedType].includes(extension)) {
      return res.status(400).json({
        success: false,
        message: 'This file is damaged or is not really a PDF, JPG or PNG'
      });
    }

    const patient = await findPatientByAnyId(patientId);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const canUpload = isHospitalStaff(uploadedByRole) ||
      (uploadedByRole === 'patient' && patient._id.toString() === uploadedBy.toString()) ||
      (uploadedByRole === 'doctor' && await doctorCanAccessPatient(uploadedBy, patient._id));

    if (!canUpload) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload a report for this patient'
      });
    }

    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'medical-reports'
    );

    const report = new Report({
      patient: patient._id,
      patientId: patient.patientId,
      patientName: patient.name,
      reportType,
      reportTitle,
      // Signed URL: the file is private and only reachable through this signature.
      cloudinaryUrl: getSignedFileUrl({
        publicId: cloudinaryResult.public_id,
        resourceType: cloudinaryResult.resource_type,
        deliveryType: cloudinaryResult.type,
        format: cloudinaryResult.format
      }),
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryResourceType: cloudinaryResult.resource_type,
      cloudinaryDeliveryType: cloudinaryResult.type,
      cloudinaryFormat: cloudinaryResult.format,
      fileName: req.file.originalname,
      fileType: detectedType,
      testDate: parsedTestDate,
      uploadedBy,
      uploadedByRole,
      notes: notes || '',
      status: 'pending'
    });

    try {
      await report.save();
    } catch (saveError) {
      // Don't leave a file on Cloudinary that no report points to.
      await deleteFromCloudinary(
        cloudinaryResult.public_id,
        cloudinaryResult.resource_type,
        cloudinaryResult.type
      ).catch((cleanupError) => console.error('Cloudinary cleanup failed:', cleanupError.message));
      throw saveError;
    }

    // AI extraction runs in the background from the bytes we already have.
    extractDataInBackground(
      report._id,
      { buffer: req.file.buffer, mimeType: detectedType },
      reportType,
      req.app.get('io'),
      req.app.get('connectedUsers')
    );

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
      ...errorDetails(error)
    });
  }
};

/**
 * Background AI extraction (async)
 */
const extractDataInBackground = async (reportId, file, reportType, io = null, connectedUsers = null) => {
  const markFailed = (message) => Report.findByIdAndUpdate(reportId, {
    aiProcessed: false,
    aiProcessingError: message
  });

  try {
    const extractionResult = await extractMedicalData(file, reportType);

    if (!extractionResult.success) {
      await markFailed(extractionResult.error);
      return;
    }

    const { structured, metrics, summary } = structureExtractedData(extractionResult.data, reportType);

    if (Object.keys(structured).length === 0) {
      await markFailed('No values could be found in this file');
      return;
    }

    const updatedReport = await Report.findByIdAndUpdate(reportId, {
      extractedData: structured,
      metrics,
      aiProcessed: true,
      aiProcessingError: null,
      status: 'processed',
      summary
    }, { new: true }).populate('patient', 'name email patientId');

    // A failed notification must not fail the extraction.
    try {
      const connection = updatedReport && connectedUsers && connectedUsers[updatedReport.patient._id.toString()];
      if (io && connection) {
        io.to(connection.socketId).emit('report_processed', {
          reportId: updatedReport._id,
          reportTitle: updatedReport.reportTitle,
          reportType: updatedReport.reportType,
          metrics,
          message: `Your ${updatedReport.reportType} report has been processed`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (socketError) {
      console.error('Socket notification error:', socketError);
    }
  } catch (error) {
    console.error('Background extraction error:', error);
    await markFailed('AI could not read this file').catch(() => {});
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
    } else if (userRole === 'doctor') {
      const patientIds = await Appointment.distinct('patientId', { doctorId: userId });
      query.patient = { $in: patientIds };

      if (patientId) {
        const patient = await findPatientByAnyId(patientId);
        query.patient = patient && patientIds.some(id => id.toString() === patient._id.toString())
          ? patient._id
          : { $in: [] };
      }
    } else if (patientId) {
      // Doctors/staff can filter by patient
      const patient = await findPatientByAnyId(patientId);
      query.patient = patient ? patient._id : { $in: [] };
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
      ...errorDetails(error)
    });
  }
};

/**
 * Get single report by ID
 */
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
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

    if (!(await reportIsAccessible(report, req.user))) {
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
      ...errorDetails(error)
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
      ...errorDetails(error)
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

    if (!(await reportIsAccessible(report, req.user))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete from Cloudinary
    try {
      const resourceType = report.cloudinaryResourceType ||
        (report.fileType && report.fileType.includes('pdf') ? 'raw' : 'image');
      await deleteFromCloudinary(
        report.cloudinaryPublicId,
        resourceType,
        report.cloudinaryDeliveryType || 'upload'
      );
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
      ...errorDetails(error)
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

    if (!(await reportIsAccessible(report, req.user))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
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
      ...errorDetails(error)
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
    } else if (userRole === 'doctor') {
      const patientIds = await Appointment.distinct('patientId', { doctorId: userId });
      query.patient = { $in: patientIds };

      if (patientId) {
        const patient = await findPatientByAnyId(patientId);
        query.patient = patient && patientIds.some(id => id.toString() === patient._id.toString())
          ? patient._id
          : { $in: [] };
      }
    } else if (patientId) {
      const patient = await findPatientByAnyId(patientId);
      query.patient = patient ? patient._id : { $in: [] };
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
      ...errorDetails(error)
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