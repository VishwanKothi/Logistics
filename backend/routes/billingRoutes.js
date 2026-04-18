const express = require('express');
const { body } = require('express-validator');
const billingController = require('../controllers/billingController');
const handleValidationErrors = require('../middleware/validation');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// All billing routes are ADMIN only

// Get Weekly Report
router.get('/reports/weekly', authMiddleware, roleMiddleware('ADMIN'), billingController.getWeeklyReport);

// Get Invoices by Status
router.get('/status', authMiddleware, roleMiddleware('ADMIN'), billingController.getInvoicesByStatus);

// Get Order Invoices
router.get('/order/:orderId', authMiddleware, roleMiddleware('ADMIN'), billingController.getOrderInvoices);

// Create Invoice
router.post(
  '/',
  authMiddleware,
  roleMiddleware('ADMIN'),
  [
    body('order_id', 'Order ID is required').isInt(),
    body('amount', 'Amount is required').isFloat({ gt: 0 }),
  ],
  handleValidationErrors,
  billingController.createInvoice
);

// Get Invoice by ID
router.get('/:invoiceId', authMiddleware, roleMiddleware('ADMIN'), billingController.getInvoiceById);

// Update Invoice Status
router.patch(
  '/:invoiceId/status',
  authMiddleware,
  roleMiddleware('ADMIN'),
  [body('status', 'Status is required').notEmpty()],
  handleValidationErrors,
  billingController.updateInvoiceStatus
);

module.exports = router;
