const express = require('express');
const { getUsers, getWorkerAnalytics, getWorkerById, addWorkerByContractor } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/analytics', protect, getWorkerAnalytics);
router.get('/:id', protect, getWorkerById);
router.post('/add-worker', protect, authorizeRoles('admin', 'contractor', 'site_manager'), addWorkerByContractor);

module.exports = router;



