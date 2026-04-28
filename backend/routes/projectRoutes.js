
const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  assignEngineers,
  assignSiteManagers,
  addMilestone,
  updateMilestone,
  removeMilestone,
  getAssignedProjects,
} = require('../controllers/projectController');
const { getAssignedProjects: smGetProjects } = require('../controllers/siteManagerController');
const { protect } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

// CRUD - Apply proper RBAC
router.post(
  '/',
  protect,
  authorize('admin', 'contractor'), // Admin and contractor can create projects
  validate([body('name').notEmpty().withMessage('Name is required')]),
  createProject
);

router.get('/', protect, getProjects); // All authenticated users can see projects (filtered by role)
router.get('/assigned', protect, authorize('site_manager'), smGetProjects); // Only site managers can get their assigned projects
router.get('/:id', protect, getProject); // All authenticated users can view project details

router.put(
  '/:id',
  protect,
  authorize('admin', 'contractor'), // Only admin and contractor can update projects
  validate([body('name').optional().notEmpty().withMessage('Name cannot be empty')]),
  updateProject
);

router.delete('/:id', protect, authorize('admin'), deleteProject); // Only admin can delete projects

// Assign engineers - Only admin and contractor can assign
router.post(
  '/:id/assign-engineers',
  protect,
  authorize('admin', 'contractor'),
  validate([body('engineers').isArray({ min: 1 }).withMessage('Engineers must be an array')]),
  assignEngineers
);

// Assign site managers - Only admin and contractor can assign
router.post(
  '/:id/assign-site-managers',
  protect,
  authorize('admin', 'contractor'),
  validate([body('siteManagers').isArray({ min: 1 }).withMessage('Site managers must be an array')]),
  assignSiteManagers
);

// Milestones - Only admin and engineer can manage milestones
router.post(
  '/:id/milestones',
  protect,
  authorize('admin', 'engineer'),
  validate([body('title').notEmpty().withMessage('Title is required')]),
  addMilestone
);

router.put(
  '/:id/milestones/:milestoneId',
  protect,
  authorize('admin', 'engineer'),
  validate([body('title').optional().notEmpty().withMessage('Title cannot be empty')]),
  updateMilestone
);

router.delete(
  '/:id/milestones/:milestoneId',
  protect,
  authorize('admin', 'engineer'),
  removeMilestone
);

module.exports = router;
