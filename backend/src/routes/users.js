const express = require('express');
const {
  getAllUsers,
  createUser,
  getUserById,
  getPatients,
  getDoctors,
  updateUser,
  resetUserPassword,
  deleteUser
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { requireRoles, STAFF_ROLES } = require('../utils/access');

const router = express.Router();

router.use(auth);

// User routes
router.get('/', requireRoles(...STAFF_ROLES), getAllUsers);   // GET /api/users (staff only)
router.post('/', requireRoles('admin'), createUser);         // POST /api/users (admin only)
router.get('/patients', getPatients);                         // GET /api/users/patients (staff: all, doctor: own)
router.get('/doctors', getDoctors);                           // GET /api/users/doctors
router.get('/:id', getUserById);                              // GET /api/users/:id
router.put('/:id', updateUser);                               // PUT /api/users/:id (self or admin)
router.post('/:id/reset-password', requireRoles('admin'), resetUserPassword); // POST /api/users/:id/reset-password
router.delete('/:id', requireRoles('admin'), deleteUser);     // DELETE /api/users/:id (admin only)

module.exports = router;
