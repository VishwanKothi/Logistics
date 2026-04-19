import api from './api';

const shipmentService = {
  getActiveShipments: () => api.get('/shipments/active'),
  getDriverDeliveries: () => api.get('/shipments/driver/deliveries'),
  getWarehouseShipments: (filter) => api.get(`/shipments/warehouse${filter ? `?filter=${filter}` : ''}`),
  getShipmentsByOrder: (orderId) => api.get(`/shipments/order/${orderId}`),
  getShipmentById: (id) => api.get(`/shipments/${id}`),
  createShipment: (data) => api.post('/shipments', data),
  updateStatus: (id, newStatus) => api.patch(`/shipments/${id}/status`, { newStatus }),
  routeShipment: (id, data) => api.patch(`/shipments/${id}/route`, data),
  assignDriver: (id, driverType, driverId) => api.patch(`/shipments/${id}/assign-driver`, { driver_type: driverType, driver_id: driverId }),
};

export default shipmentService;
