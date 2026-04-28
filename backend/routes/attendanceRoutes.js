const express = require('express');
const { body } = require('express-validator');
const {
  getAllAttendance,
  markAttendance,
  getWorkerAttendance,
  getProjectAttendance,
  getAttendanceSummary,
  getAttendanceStats,
  getDailyStrength,
  getLaborDistribution,
  bulkMarkAttendance,
  updateAttendance,
} = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Get all attendance records (All authenticated users can view)
router.get('/', protect, getAllAttendance);

// Mark attendance (Site Managers only)
router.post(
  '/',
  protect,
  authorizeRoles('admin', 'site_manager'),
  validate([
    body('worker').notEmpty().withMessage('Worker is required'),
    body('project').notEmpty().withMessage('Project is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('status').optional().isIn(['present', 'absent', 'half_day', 'leave', 'holiday']).withMessage('Invalid status'),
  ]),
  markAttendance
);

// Bulk mark attendance (Site Managers only)
router.post(
  '/bulk',
  protect,
  authorizeRoles('admin', 'site_manager'),
  validate([
    body('date').notEmpty().withMessage('Date is required'),
    body('project').notEmpty().withMessage('Project is required'),
    body('attendanceRecords').isArray().withMessage('Attendance records must be an array'),
  ]),
  bulkMarkAttendance
);

// Update attendance (Site Managers only)
router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'site_manager'),
  validate([
    body('status').optional().isIn(['present', 'absent', 'half_day', 'leave', 'holiday']).withMessage('Invalid status'),
  ]),
  updateAttendance
);

// Worker attendance history (All authenticated users can view)
router.get('/worker/:workerId', protect, getWorkerAttendance);

// Project/day attendance (All authenticated users can view)
router.get('/project/:projectId', protect, getProjectAttendance);

// Summary by status (All authenticated users can view)
router.get('/project/:projectId/summary', protect, getAttendanceSummary);

// Attendance statistics for dashboard
router.get('/stats', protect, getAttendanceStats);

// Daily strength data for charts
router.get('/analytics/daily-strength', protect, getDailyStrength);

// Labor distribution for charts
router.get('/analytics/labor-distribution', protect, getLaborDistribution);

module.exports = router;
