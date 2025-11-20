const express = require('express');
const { sendMessage } = require('../controllers/sahayakController');

const router = express.Router();

router.post('/sahayak', sendMessage);

module.exports = router; 