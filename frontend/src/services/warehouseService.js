import api from './api';

const warehouseService = {
  getAllWarehouses: () => api.get('/warehouses'),
  getWarehouseById: (id) => api.get(`/warehouses/${id}`),
  getWarehouseDrivers: (warehouseId) => api.get(`/warehouses/${warehouseId}/drivers`),
};

export default warehouseService;
