import api from './api';

const exceptionService = {
  createException: (exceptionData) => api.post('/exceptions', exceptionData),
  getExceptionById: (exceptionId) => api.get(`/exceptions/${exceptionId}`),
  getOpenExceptions: (filters) => api.get('/exceptions', { params: filters }),
  getOrderExceptions: (orderId) => api.get(`/exceptions/order/${orderId}`),
  resolveException: (exceptionId, data) =>
    api.patch(`/exceptions/${exceptionId}/resolve`, data),
};

export default exceptionService;
