import api from './api';

const deliveryProofService = {
  uploadProof: (formData) => api.post('/delivery-proofs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getOrderProofs: (orderId) => api.get(`/delivery-proofs/order/${orderId}`),
  getUnverifiedProofs: () => api.get('/delivery-proofs'),
  verifyProof: (proofId) => api.patch(`/delivery-proofs/${proofId}/verify`),
};

export default deliveryProofService;
