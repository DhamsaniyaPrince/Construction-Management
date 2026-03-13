const express = require('express');
const {
  createMaterialRequest,
  getMaterialRequests,
  getMaterialRequestById,
  updateMaterialRequestStatus,
  getMaterialRequestsForContractor,
  deleteMaterialRequest
} = require('../controllers/materialRequestController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Create material request
router.post('/', protect, authorizeRoles('admin', 'site_manager', 'contractor'), createMaterialRequest);

// Get all material requests
router.get('/', protect, getMaterialRequests);

// Get material request by ID
router.get('/:id', protect, getMaterialRequestById);

// Update material request status
router.put('/:id', protect, authorizeRoles('admin', 'site_manager', 'contractor'), updateMaterialRequestStatus);

// Get material requests for contractors
router.get('/contractor/assigned', protect, authorizeRoles('contractor'), getMaterialRequestsForContractor);

// Delete material request
router.delete('/:id', protect, authorizeRoles('admin', 'site_manager'), deleteMaterialRequest);

module.exports = router;
