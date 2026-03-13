const express = require('express');
const { body } = require('express-validator');
const {
  markAttendance,
  getWorkerAttendance,
  getProjectAttendance,
  getAttendanceSummary,
} = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Mark attendance
router.post(
  '/',
  protect,
  authorizeRoles('admin', 'engineer', 'contractor'),
  validate([
    body('worker').notEmpty().withMessage('Worker is required'),
    body('project').notEmpty().withMessage('Project is required'),
    body('date').notEmpty().withMessage('Date is required'),
  ]),
  markAttendance
);

// Worker attendance history
router.get('/worker/:workerId', protect, getWorkerAttendance);

// Project/day attendance
router.get('/project/:projectId', protect, getProjectAttendance);

// Summary by status
router.get('/project/:projectId/summary', protect, authorizeRoles('admin', 'engineer'), getAttendanceSummary);

module.exports = router;
