const express = require('express');
const router = express.Router();
const { registerPatient, registerStaff } = require('../controllers/authController');

router.post('/register/patient', registerPatient);
router.post('/register/staff', registerStaff);

module.exports = router;