const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const handleValidationErrors = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Valid email is required').isEmail(),
    body('phone', 'Phone is required').notEmpty(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('role', 'Role is required').notEmpty(),
  ],
  handleValidationErrors,
  userController.register
);

// Login
router.post(
  '/login',
  [
    body('email', 'Valid email is required').isEmail(),
    body('password', 'Password is required').notEmpty(),
  ],
  handleValidationErrors,
  userController.login
);

// Get Profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update Profile
router.put('/profile', authMiddleware, userController.updateProfile);

// Get Users by Role
router.get('/role/:role', authMiddleware, userController.getUsersByRole);

module.exports = router;
