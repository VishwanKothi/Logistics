const express = require('express');
const { body } = require('express-validator');
const shipmentController = require('../controllers/shipmentController');
const handleValidationErrors = require('../middleware/validation');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get Active Shipments (role-filtered in controller)
router.get('/active', authMiddleware, shipmentController.getActiveShipments);

// Get Driver's Pending Deliveries
router.get('/driver/deliveries', authMiddleware, roleMiddleware('DRIVER'), shipmentController.getDriverDeliveries);

// Get Warehouse Shipments — Manager, Staff
router.get('/warehouse', authMiddleware, roleMiddleware('MANAGER', 'WAREHOUSE_STAFF'), shipmentController.getWarehouseShipments);

// Get Shipments by Order
router.get('/order/:orderId', authMiddleware, shipmentController.getShipmentsByOrder);

// Create Shipment — Manager only
router.post(
  '/',
  authMiddleware,
  roleMiddleware('ADMIN', 'MANAGER'),
  [body('order_id', 'Order ID is required').isInt()],
  handleValidationErrors,
  shipmentController.createShipment
);

// Get Shipment by ID
router.get('/:shipmentId', authMiddleware, shipmentController.getShipmentById);

// Update Shipment Status (role-validated in controller)
router.patch(
  '/:shipmentId/status',
  authMiddleware,
  [body('newStatus', 'Status is required').notEmpty()],
  handleValidationErrors,
  shipmentController.updateShipmentStatus
);

// Route Shipment — Manager decides next stop
router.patch(
  '/:shipmentId/route',
  authMiddleware,
  roleMiddleware('MANAGER', 'ADMIN'),
  shipmentController.routeShipment
);

// Assign Driver — Staff
router.patch(
  '/:shipmentId/assign-driver',
  authMiddleware,
  roleMiddleware('WAREHOUSE_STAFF', 'MANAGER', 'ADMIN'),
  shipmentController.assignDriver
);

module.exports = router;
