const express = require('express');
const router = express.Router();
const { getBlueprints, uploadBlueprint } = require('../controllers/blueprintController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getBlueprints)
  .post(protect, authorizeRoles('engineer', 'site_manager', 'admin'), uploadBlueprint);

module.exports = router;
