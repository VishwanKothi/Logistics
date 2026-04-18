const deliveryProofService = require('../services/deliveryProofService');

class DeliveryProofController {
  async uploadProof(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const proofData = {
        shipment_id: parseInt(req.body.shipment_id || req.body.shipmentId, 10),
        proof_type: req.body.proof_type || req.body.proofType,
        file_url: req.file.path,
        uploaded_by_id: req.user.user_id,
      };

      const proof = await deliveryProofService.createDeliveryProof(proofData);

      res.status(201).json({
        message: 'Proof uploaded successfully',
        proof,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getShipmentProofs(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) {
        return res.status(400).json({ error: 'Invalid shipment ID' });
      }

      const proofs = await deliveryProofService.getProofByShipment(shipmentId);

      res.status(200).json(proofs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUnverifiedProofs(req, res) {
    try {
      const userRole = req.user.role;
      const userId = req.user.user_id;

      // For DRIVER/WAREHOUSE_STAFF, show their own uploaded proofs
      // For ADMIN/MANAGER, show all pending proofs for verification
      if (userRole === 'DRIVER' || userRole === 'WAREHOUSE_STAFF') {
        const proofs = await deliveryProofService.getProofsByUploader(userId);
        res.status(200).json(proofs);
      } else {
        const proofs = await deliveryProofService.getUnverifiedProofs();
        res.status(200).json(proofs);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async verifyProof(req, res) {
    try {
      const proofId = parseInt(req.params.proofId, 10);
      if (isNaN(proofId)) {
        return res.status(400).json({ error: 'Invalid proof ID' });
      }

      const proof = await deliveryProofService.verifyProof(proofId);

      res.status(200).json({
        message: 'Proof verified successfully',
        proof,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DeliveryProofController();
