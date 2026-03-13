const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask } = require('../controllers/taskController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTasks)
  .post(protect, authorizeRoles('contractor', 'site_manager', 'engineer', 'admin'), createTask);

router.route('/:id')
  .put(protect, updateTask);

module.exports = router;
