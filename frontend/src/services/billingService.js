import api from './api';

const billingService = {
  createInvoice: (invoiceData) => api.post('/billing', invoiceData),
  getInvoiceById: (invoiceId) => api.get(`/billing/${invoiceId}`),
  getOrderInvoices: (orderId) => api.get(`/billing/order/${orderId}`),
  getInvoicesByStatus: (status) => api.get('/billing/status', { params: { status } }),
  updateInvoiceStatus: (invoiceId, status) =>
    api.patch(`/billing/${invoiceId}/status`, { status }),
  getWeeklyReport: () => api.get('/billing/reports/weekly'),
};

export default billingService;
