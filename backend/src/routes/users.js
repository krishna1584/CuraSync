const express = require('express');
const { 
  getAllUsers, 
  getUserById, 
  getPatients, 
  getDoctors, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');

const router = express.Router();

// User routes
router.get('/', getAllUsers);           // GET /api/users
router.get('/patients', getPatients);   // GET /api/users/patients  
router.get('/doctors', getDoctors);     // GET /api/users/doctors
router.get('/:id', getUserById);        // GET /api/users/:id
router.put('/:id', updateUser);         // PUT /api/users/:id
router.delete('/:id', deleteUser);      // DELETE /api/users/:id

module.exports = router;