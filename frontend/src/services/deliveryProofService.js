import api from './api';

const deliveryProofService = {
  uploadProof: (formData) => api.post('/delivery-proofs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getShipmentProofs: (shipmentId) => api.get(`/delivery-proofs/shipment/${shipmentId}`),
  getUnverifiedProofs: () => api.get('/delivery-proofs'),
  verifyProof: (proofId) => api.patch(`/delivery-proofs/${proofId}/verify`),
};

export default deliveryProofService;
