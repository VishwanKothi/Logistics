const express = require('express');
const { body } = require('express-validator');
const shipmentController = require('../controllers/shipmentController');
const handleValidationErrors = require('../middleware/validation');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get Active Shipments (role-filtered in controller)
router.get('/active', authMiddleware, shipmentController.getActiveShipments);

// Get Driver's Pending Deliveries
router.get('/driver/deliveries/pending', authMiddleware, roleMiddleware('DRIVER'), shipmentController.getDriverDeliveries);

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

// Dispatch Shipment — Staff assigns driver and dispatches
router.patch(
  '/:shipmentId/dispatch',
  authMiddleware,
  roleMiddleware('WAREHOUSE_STAFF', 'MANAGER', 'ADMIN'),
  [body('driver_id', 'Driver ID is required').isInt()],
  handleValidationErrors,
  shipmentController.dispatchShipment
);

// Receive at Warehouse — Staff receives package
router.patch(
  '/:shipmentId/receive',
  authMiddleware,
  roleMiddleware('WAREHOUSE_STAFF', 'MANAGER', 'ADMIN'),
  shipmentController.receiveAtWarehouse
);

// Assign Driver — Manager, Staff
router.patch(
  '/:shipmentId/assign-driver',
  authMiddleware,
  roleMiddleware('ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'),
  shipmentController.assignDriver
);

module.exports = router;
