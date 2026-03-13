const express = require('express');
<<<<<<< HEAD
const { getUsers, getWorkerAnalytics, getWorkerById, addWorkerByContractor, updateWorkerSalary } = require('../controllers/userController');
=======
const { getUsers, getWorkerAnalytics, getWorkerById, addWorkerByContractor } = require('../controllers/userController');
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/analytics', protect, getWorkerAnalytics);
router.get('/:id', protect, getWorkerById);
router.post('/add-worker', protect, authorizeRoles('admin', 'contractor', 'site_manager'), addWorkerByContractor);
<<<<<<< HEAD
router.put('/update-salary', protect, authorizeRoles('admin', 'contractor', 'site_manager'), updateWorkerSalary);
=======
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69

module.exports = router;



