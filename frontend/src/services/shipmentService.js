import api from './api';

const shipmentService = {
  getActiveShipments: () => api.get('/shipments/active'),
  getDriverDeliveries: () => api.get('/shipments/driver/deliveries/pending'),
  getWarehouseShipments: (filter) => api.get(`/shipments/warehouse${filter ? `?filter=${filter}` : ''}`),
  getShipmentsByOrder: (orderId) => api.get(`/shipments/order/${orderId}`),
  getShipmentById: (id) => api.get(`/shipments/${id}`),
  createShipment: (data) => api.post('/shipments', data),
  updateStatus: (id, newStatus, changeReason) => api.patch(`/shipments/${id}/status`, { newStatus, changeReason }),
  routeShipment: (id, data) => api.patch(`/shipments/${id}/route`, data),
  dispatchShipment: (id, data) => api.patch(`/shipments/${id}/dispatch`, data),
  receiveAtWarehouse: (id) => api.patch(`/shipments/${id}/receive`),
  assignDriver: (id, driverId) => api.patch(`/shipments/${id}/assign-driver`, { driver_id: driverId }),
};

export default shipmentService;
