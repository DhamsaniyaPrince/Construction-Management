const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, updateInvoiceStatus } = require('../controllers/invoiceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getInvoices)
  .post(protect, authorizeRoles('contractor', 'admin'), createInvoice);

router.route('/:id')
  .put(protect, authorizeRoles('site_manager', 'admin'), updateInvoiceStatus);

module.exports = router;
