const express = require('express');
const { body } = require('express-validator');
const {
  addEquipment,
  getEquipmentList,
  getEquipment,
  assignEquipment,
  updateEquipmentStatus,
} = require('../controllers/equipmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('name').notEmpty().withMessage('Name is required')]),
  addEquipment
);
router.get('/', protect, getEquipmentList);
router.get('/:id', protect, getEquipment);
router.post(
  '/:id/assign',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body('project').notEmpty().withMessage('Project is required')]),
  assignEquipment
);
router.put(
  '/:id/status',
  protect,
  authorizeRoles('admin', 'engineer'),
  validate([body().custom((value) => Object.keys(value).length > 0).withMessage('Provide fields to update')]),
  updateEquipmentStatus
);

module.exports = router;
