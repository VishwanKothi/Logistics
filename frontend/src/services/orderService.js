import api from './api';

const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getAllOrders: (params = {}) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export default orderService;
