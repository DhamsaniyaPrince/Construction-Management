const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const { createReport, listReports } = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

// Use memory storage for now, files will be saved in controller
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();

router.post(
  '/',
  protect,
  authorizeRoles('admin', 'engineer', 'worker'),
  upload.array('images', 5),
  validate([
    body('project').notEmpty().withMessage('Project is required'),
    body('text').notEmpty().withMessage('Text is required'),
  ]),
  createReport
);
router.get('/', protect, listReports);

module.exports = router;
