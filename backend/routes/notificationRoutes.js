const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/mark-all-read', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
