const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const handleValidationErrors = require('../middleware/validation');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Create Order — Customer, Manager, Admin
router.post(
  '/',
  authMiddleware,
  roleMiddleware('ADMIN', 'MANAGER', 'CUSTOMER'),
  [
    body('sender_name', 'Sender name is required').notEmpty(),
    body('pickup_address', 'Pickup address is required').notEmpty(),
    body('pickup_city', 'Pickup city is required').notEmpty(),
    body('receiver_name', 'Receiver name is required').notEmpty(),
    body('receiver_phone', 'Receiver phone is required').notEmpty(),
    body('delivery_address', 'Delivery address is required').notEmpty(),
    body('delivery_city', 'Delivery city is required').notEmpty(),
    body('origin_warehouse_id', 'Origin warehouse is required').isInt(),
  ],
  handleValidationErrors,
  orderController.createOrder
);

// Get All Orders (role-filtered in controller)
router.get('/', authMiddleware, orderController.getOrders);

// Get Order by ID
router.get('/:orderId', authMiddleware, orderController.getOrderById);

// Update Order — Manager, Admin
router.put(
  '/:orderId',
  authMiddleware,
  roleMiddleware('ADMIN', 'MANAGER'),
  orderController.updateOrder
);

// Update Order Status — Manager, Admin
router.patch(
  '/:orderId/status',
  authMiddleware,
  roleMiddleware('ADMIN', 'MANAGER'),
  [body('status', 'Status is required').notEmpty()],
  handleValidationErrors,
  orderController.updateOrderStatus
);

module.exports = router;
