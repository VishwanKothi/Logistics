const express = require('express');
const multer = require('multer');
const deliveryProofController = require('../controllers/deliveryProofController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const config = require('../config/config');

const upload = multer({
  dest: config.UPLOAD_DIR,
  limits: { fileSize: config.MAX_FILE_SIZE },
});

const router = express.Router();

// Get Unverified Proofs (must be before /:proofId)
router.get('/', authMiddleware, roleMiddleware('ADMIN', 'MANAGER', 'DRIVER', 'WAREHOUSE_STAFF'), deliveryProofController.getUnverifiedProofs);

// Get Shipment Proofs (must be before /:proofId)
router.get('/shipment/:shipmentId', authMiddleware, deliveryProofController.getShipmentProofs);

// Upload Delivery Proof
router.post(
  '/upload',
  authMiddleware,
  roleMiddleware('DRIVER', 'WAREHOUSE_STAFF'),
  upload.single('proof'),
  deliveryProofController.uploadProof
);

// Verify Proof
router.patch(
  '/:proofId/verify',
  authMiddleware,
  roleMiddleware('ADMIN', 'MANAGER'),
  deliveryProofController.verifyProof
);

module.exports = router;
