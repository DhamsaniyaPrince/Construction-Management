const express = require('express');
const { body } = require('express-validator');
const {
  requestMaterial,
  reviewMaterial,
  getMaterials,
  updateMaterialStatus,
} = require('../controllers/materialController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Request material
router.post(
  '/',
  protect,
  authorizeRoles('admin', 'engineer', 'contractor'),
  validate([
    body('project').notEmpty().withMessage('Project is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('quantity').isNumeric().withMessage('Quantity must be numeric'),
  ]),
  requestMaterial
);

// Approve / Reject
router.post(
  '/:id/review',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject')]),
  reviewMaterial
);

// List materials (optional project filter)
router.get('/', protect, getMaterials);

// Update status (ordered/delivered etc.)
router.put(
  '/:id/status',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('status').notEmpty().withMessage('Status is required')]),
  updateMaterialStatus
);

module.exports = router;
