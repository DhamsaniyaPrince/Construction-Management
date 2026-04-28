const express = require('express');
const {
  createMaterialRequest,
  engineerApproval,
  contractorApproval,
  completeMaterial,
  getAllMaterialRequests,
  getProjectMaterialRequests,
  getMyMaterialRequests,
  getEngineerMaterialRequests,
  getMaterialRequestById,
  // Legacy functions
  getMaterialRequests,
  updateMaterialRequestStatus,
  getMaterialRequestsForContractor,
  deleteMaterialRequest
} = require('../controllers/materialRequestController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getEngineerMaterialRequests: engineerGetRequests } = require('../controllers/engineerController');
const { getMyMaterialRequests: smGetRequests, createMaterialRequest: smCreateRequest } = require('../controllers/siteManagerController');
const { 
  getContractorMaterialRequests: contractorGetRequests, 
  contractorApproval: contractorApproveRequest,
  updateMaterialRequestStatus: contractorUpdateStatus
} = require('../controllers/contractorController');

const router = express.Router();

// NEW WORKFLOW ROUTES - Put specific routes first

// Get material requests for a specific project (more specific)
router.get('/project/:projectId', protect, authorizeRoles('admin', 'engineer', 'contractor', 'site_manager'), getProjectMaterialRequests);

// Get material requests created by current user (Site Manager) (more specific)
router.get('/my-requests', protect, authorizeRoles('site_manager'), getMyMaterialRequests);

// Get material requests for Engineer approval (more specific)
router.get('/engineer/pending', protect, authorizeRoles('engineer'), engineerGetRequests);

// Get material requests for contractors (legacy) (more specific)
router.get('/contractor/assigned', protect, authorizeRoles('contractor'), contractorGetRequests);

// Create material request (Site Manager only)
router.post('/request', protect, authorizeRoles('site_manager'), smCreateRequest);

// Engineer approval/rejection
router.put('/:id/engineer-approval', protect, authorizeRoles('engineer'), engineerApproval);

// Contractor approval/rejection
router.put('/:id/contractor-approval', protect, authorizeRoles('contractor'), contractorApproveRequest);

// Update material request status (contractor only)
router.put('/:id/status', protect, authorizeRoles('contractor'), contractorUpdateStatus);

// Mark material as completed/issued
router.put('/:id/complete', protect, authorizeRoles('admin', 'contractor'), completeMaterial);

// Get single material request by ID
router.get('/:id', protect, getMaterialRequestById);

// Get all material requests (Admin, Engineer, Contractor, Site Manager) - less specific, comes last
router.get('/', protect, authorizeRoles('admin', 'engineer', 'contractor', 'site_manager'), getAllMaterialRequests);

// LEGACY ROUTES (for backward compatibility)

// Create material request (legacy)
router.post('/', protect, authorizeRoles('admin', 'site_manager', 'contractor'), createMaterialRequest);

// Update material request status (legacy)
router.put('/:id', protect, authorizeRoles('admin', 'site_manager', 'contractor'), updateMaterialRequestStatus);

// Delete material request
router.delete('/:id', protect, authorizeRoles('admin', 'site_manager'), deleteMaterialRequest);

module.exports = router;
