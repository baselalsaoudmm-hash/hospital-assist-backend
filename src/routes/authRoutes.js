const express = require('express');
const router = express.Router();
const { registerPatient, registerStaff, login } = require('../controllers/authController');

router.post('/register/patient', registerPatient);
router.post('/register/staff', registerStaff);
router.post('/login', login);

module.exports = router;