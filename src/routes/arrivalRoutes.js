const express = require('express');
const router = express.Router();
const { arrival } = require('../controllers/arrivalController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/', authenticate, requireRole('patient'), arrival);

module.exports = router;