import api from './api';

const userService = {
  register: (userData) => api.post('/users/register', userData),
  login: (email, password) => api.post('/users/login', { email, password }),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
  getLocalDrivers: (warehouseId) => api.get('/users/drivers/local', { params: { warehouse_id: warehouseId } }),
  getHeavyDrivers: (warehouseId, destWarehouseId) => api.get('/users/drivers/heavy', { params: { warehouse_id: warehouseId, dest_warehouse_id: destWarehouseId } }),
};

export default userService;
