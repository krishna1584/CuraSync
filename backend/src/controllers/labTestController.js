const LabTest = require('../models/LabTest');
const User = require('../models/User');
const {
  isHospitalStaff,
  sameId,
  doctorCanAccessPatient,
  canAccessPatientData,
  pick,
  errorDetails
} = require('../utils/access');

// Fields the ordering doctor or hospital staff may change.
const UPDATABLE_FIELDS = ['status', 'scheduledDate', 'completedDate', 'results', 'cost', 'testName', 'testType'];

const refId = (ref) => (ref && ref._id ? ref._id : ref);

const canViewLabTest = (labTest, user) => (
  isHospitalStaff(user.role) ||
  sameId(refId(labTest.patientId), user._id) ||
  sameId(refId(labTest.doctorId), user._id)
);

const serverError = (res, label, error) => {
  console.error(`${label} error:`, error);
  return res.status(500).json({ success: false, message: 'Internal server error', ...errorDetails(error) });
};

const populateLabTest = (query) => query
  .populate('patientId', 'name email phone')
  .populate('doctorId', 'name specialization');

// GET /api/lab-tests — staff see all, doctors their orders, patients their own
const getAllLabTests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'doctor') query = { doctorId: req.user._id };
    else if (!isHospitalStaff(req.user.role)) query = { patientId: req.user._id };

    const labTests = await populateLabTest(LabTest.find(query)).sort({ orderDate: -1 });

    res.status(200).json({ success: true, message: 'Lab tests fetched successfully', data: labTests });
  } catch (error) {
    return serverError(res, 'Get lab tests', error);
  }
};

// POST /api/lab-tests/book
const LAB_TEST_TYPES = ['blood', 'urine', 'imaging', 'other'];

// Work out the stored testType from what the client sent.
const resolveTestType = ({ testType, sampleType, testCategory }) => {
  const explicit = String(testType || '').toLowerCase();
  if (LAB_TEST_TYPES.includes(explicit)) return explicit;
  const sample = String(sampleType || '').toLowerCase();
  if (sample === 'blood' || sample === 'urine') return sample;
  if (/imaging|x-ray|scan|ultrasound/i.test(String(testCategory || ''))) return 'imaging';
  return 'other';
};

/**
 * POST /api/lab-tests/book
 * Body: { patientId, doctorId?, scheduledDate?, timeSlot?, tests: [{ testName, testCategory?, testCode?, sampleType?, testType?, cost? }] }
 * A single test can also be sent at the top level (testName, testType, cost) for older clients.
 */
const bookLabTest = async (req, res) => {
  try {
    const { patientId, doctorId, scheduledDate, timeSlot } = req.body;
    const tests = Array.isArray(req.body.tests) && req.body.tests.length > 0
      ? req.body.tests
      : (req.body.testName ? [req.body] : []);

    if (!patientId || tests.length === 0 || tests.some((t) => !t || !t.testName)) {
      return res.status(400).json({
        success: false,
        message: 'Patient and at least one test (with a name) are required'
      });
    }
    if (tests.length > 20) {
      return res.status(400).json({ success: false, message: 'You can book at most 20 tests at once' });
    }

    if (scheduledDate) {
      const when = new Date(scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(when.getTime()) || when < today) {
        return res.status(400).json({ success: false, message: 'Please choose a valid future date' });
      }
    }

    // Patients book only for themselves; doctors only under their own name and for their patients.
    if (req.user.role === 'patient' && !sameId(req.user._id, patientId)) {
      return res.status(403).json({ success: false, message: 'Patients can only book tests for themselves' });
    }
    if (req.user.role === 'doctor') {
      if (doctorId && !sameId(req.user._id, doctorId)) {
        return res.status(403).json({ success: false, message: 'Doctors can only order tests under their own name' });
      }
      if (!(await doctorCanAccessPatient(req.user._id, patientId))) {
        return res.status(403).json({ success: false, message: 'You can only order tests for your own patients' });
      }
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Doctors always order under their own name; others may optionally name a doctor.
    const orderingDoctorId = req.user.role === 'doctor' ? req.user._id : doctorId;
    if (orderingDoctorId) {
      const doctor = await User.findById(orderingDoctorId);
      if (!doctor || doctor.role !== 'doctor') {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }
    }

    const created = await LabTest.insertMany(tests.map((test) => ({
      patientId: patient._id,
      doctorId: orderingDoctorId || undefined,
      testName: String(test.testName),
      testCode: test.testCode,
      testCategory: test.testCategory,
      testType: resolveTestType(test),
      status: 'ordered',
      orderDate: new Date(),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      timeSlot,
      cost: Number(test.cost) || 0
    })));

    const populated = await populateLabTest(
      LabTest.find({ _id: { $in: created.map((t) => t._id) } })
    );

    res.status(201).json({
      success: true,
      message: `${created.length} lab test${created.length === 1 ? '' : 's'} booked successfully`,
      data: populated
    });
  } catch (error) {
    return serverError(res, 'Book lab test', error);
  }
};

// GET /api/lab-tests/:id
const getLabTestById = async (req, res) => {
  try {
    const labTest = await populateLabTest(LabTest.findById(req.params.id));

    if (!labTest) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    if (!canViewLabTest(labTest, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, message: 'Lab test fetched successfully', data: labTest });
  } catch (error) {
    return serverError(res, 'Get lab test by ID', error);
  }
};

// PUT /api/lab-tests/:id — ordering doctor or hospital staff
const updateLabTest = async (req, res) => {
  try {
    const existing = await LabTest.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    const isOrderingDoctor = req.user.role === 'doctor' && sameId(existing.doctorId, req.user._id);
    const isPatientCancelling = req.user.role === 'patient' &&
      sameId(existing.patientId, req.user._id) &&
      req.body.status === 'cancelled';

    if (!isHospitalStaff(req.user.role) && !isOrderingDoctor && !isPatientCancelling) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updates = isPatientCancelling && !isHospitalStaff(req.user.role) && !isOrderingDoctor
      ? { status: 'cancelled' }
      : pick(req.body, UPDATABLE_FIELDS);

    const labTest = await populateLabTest(
      LabTest.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    );

    res.status(200).json({ success: true, message: 'Lab test updated successfully', data: labTest });
  } catch (error) {
    return serverError(res, 'Update lab test', error);
  }
};

// GET /api/lab-tests/patient/:patientId
const getLabTestsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!(await canAccessPatientData(req.user, patientId))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const labTests = await LabTest.find({ patientId })
      .populate('doctorId', 'name specialization')
      .sort({ orderDate: -1 });

    res.status(200).json({ success: true, message: 'Patient lab tests fetched successfully', data: labTests });
  } catch (error) {
    return serverError(res, 'Get patient lab tests', error);
  }
};

module.exports = {
  getAllLabTests,
  bookLabTest,
  getLabTestById,
  updateLabTest,
  getLabTestsByPatient
};
