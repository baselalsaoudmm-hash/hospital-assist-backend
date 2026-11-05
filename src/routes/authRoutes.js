const express = require('express');
const router = express.Router();
const { registerPatient, registerStaff, login } = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register/patient', upload.single('photo'), registerPatient);
router.post('/register/staff', registerStaff);
router.post('/login', login);

// مسارات تجريبية لاختبار الحماية (بنحذفها لاحقاً)
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});
router.get('/staff-only', authenticate, requireRole('staff'), (req, res) => {
  res.json({ message: 'أهلاً بالموظف' });
});

module.exports = router;