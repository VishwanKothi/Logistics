const express = require('express');
const { body } = require('express-validator');
const exceptionController = require('../controllers/exceptionController');
const handleValidationErrors = require('../middleware/validation');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get Open Exceptions (role-filtered in controller)
router.get('/', authMiddleware, exceptionController.getOpenExceptions);

// Get Shipment Exceptions
router.get('/shipment/:shipmentId', authMiddleware, exceptionController.getShipmentExceptions);

// Create Exception Report — Driver, Warehouse Staff
router.post(
  '/',
  authMiddleware,
  roleMiddleware('DRIVER', 'WAREHOUSE_STAFF'),
  [
    body('shipment_id', 'Shipment ID is required').isInt(),
    body('exception_type', 'Exception type is required').notEmpty(),
    body('severity', 'Severity is required').notEmpty(),
    body('description', 'Description is required').notEmpty(),
  ],
  handleValidationErrors,
  exceptionController.createException
);

// Get Exception by ID
router.get('/:exceptionId', authMiddleware, exceptionController.getExceptionById);

// Resolve Exception — Manager, Admin only
router.patch(
  '/:exceptionId/resolve',
  authMiddleware,
  roleMiddleware('ADMIN', 'MANAGER'),
  [body('resolutionNotes', 'Resolution notes are required').notEmpty()],
  handleValidationErrors,
  exceptionController.resolveException
);

module.exports = router;
