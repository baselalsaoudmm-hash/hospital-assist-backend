const express = require('express');
const router = express.Router();
const {
  listTasks, acceptTask, completeTask, getTask, getTaskPhoto,
} = require('../controllers/taskController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('staff'));

router.get('/', listTasks);
router.get('/:id', getTask);
router.get('/:id/photo', getTaskPhoto);
router.put('/:id/accept', acceptTask);
router.put('/:id/complete', completeTask);

module.exports = router;