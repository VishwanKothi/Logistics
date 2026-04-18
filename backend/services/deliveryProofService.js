const prisma = require('../config/database');

class DeliveryProofService {
  async createDeliveryProof(proofData) {
    const {
      shipment_id,
      proof_type,
      file_url,
      uploaded_by_id,
    } = proofData;

    const proof = await prisma.deliveryProof.create({
      data: {
        shipment_id,
        proof_type,
        file_url,
        uploaded_by_id,
        verification_status: 'PENDING',
      },
      include: {
        shipment: {
          select: { shipment_number: true },
        },
        uploadedBy: {
          select: { name: true },
        },
      },
    });

    return proof;
  }

  async getProofByShipment(shipmentId) {
    const proofs = await prisma.deliveryProof.findMany({
      where: { shipment_id: shipmentId },
      include: {
        uploadedBy: {
          select: { name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return proofs;
  }

  async getShipmentProofs(shipmentId) {
    const proofs = await prisma.deliveryProof.findMany({
      where: { shipment_id: shipmentId },
      include: {
        uploadedBy: {
          select: { user_id: true, name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return proofs;
  }

  async getProofById(proofId) {
    const proof = await prisma.deliveryProof.findUnique({
      where: { proof_id: proofId },
      include: {
        shipment: {
          select: { shipment_number: true },
        },
        uploadedBy: {
          select: { name: true },
        },
      },
    });

    return proof || null;
  }

  async verifyProof(proofId) {
    const proof = await prisma.deliveryProof.update({
      where: { proof_id: proofId },
      data: {
        verification_status: 'VERIFIED',
        verified_at: new Date(),
      },
    });

    return proof;
  }

  async rejectProof(proofId) {
    const proof = await prisma.deliveryProof.update({
      where: { proof_id: proofId },
      data: {
        verification_status: 'REJECTED',
      },
    });

    return proof;
  }

  async getUnverifiedProofs() {
    const proofs = await prisma.deliveryProof.findMany({
      where: {
        verification_status: 'PENDING',
      },
      include: {
        shipment: {
          select: {
            shipment_id: true,
            shipment_number: true,
            order: {
              select: {
                sender_name: true,
              },
            },
          },
        },
        uploadedBy: {
          select: { name: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return proofs;
  }

  async getProofsByUploader(userId) {
    const proofs = await prisma.deliveryProof.findMany({
      where: {
        uploaded_by_id: userId,
      },
      include: {
        shipment: {
          select: {
            shipment_id: true,
            shipment_number: true,
            order: {
              select: {
                sender_name: true,
              },
            },
          },
        },
        uploadedBy: {
          select: { name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return proofs;
  }
}

module.exports = new DeliveryProofService();
