const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  assignEngineers,
  addMilestone,
  updateMilestone,
  removeMilestone,
} = require('../controllers/projectController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// CRUD
router.post(
  '/',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('name').notEmpty().withMessage('Name is required')]),
  createProject
);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('name').optional().notEmpty().withMessage('Name cannot be empty')]),
  updateProject
);
router.delete('/:id', protect, authorizeRoles('admin'), deleteProject);

// Assign engineers
router.post(
  '/:id/assign-engineers',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('engineers').isArray({ min: 1 }).withMessage('Engineers must be an array')]),
  assignEngineers
);

// Milestones
router.post(
  '/:id/milestones',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('title').notEmpty().withMessage('Title is required')]),
  addMilestone
);
router.put(
  '/:id/milestones/:milestoneId',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('title').optional().notEmpty().withMessage('Title cannot be empty')]),
  updateMilestone
);
router.delete(
  '/:id/milestones/:milestoneId',
  protect,
  authorizeRoles('admin', 'engineer'),
  removeMilestone
);

module.exports = router;
