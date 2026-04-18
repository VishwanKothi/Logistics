import api from './api';

const userService = {
  register: (userData) => api.post('/users/register', userData),
  login: (email, password) => api.post('/users/login', { email, password }),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
};

export default userService;
