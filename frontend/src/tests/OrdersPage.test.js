import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import OrdersPage from '../pages/OrdersPage';

jest.mock('../services/orderService', () => ({ __esModule: true, default: { getAllOrders: jest.fn(), createOrder: jest.fn(), updateOrderStatus: jest.fn() } }));
jest.mock('../services/warehouseService', () => ({ __esModule: true, default: { getAllWarehouses: jest.fn(), getWarehouseDrivers: jest.fn() } }));
jest.mock('../services/shipmentService', () => ({ __esModule: true, default: { getShipmentsByOrder: jest.fn() } }));

const renderOrders = (role = 'ADMIN') => {
  localStorage.setItem('token', 'tk');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Admin', email: 'a@t.com', role, warehouse_id: null }));
  return render(<BrowserRouter><AuthProvider><OrdersPage /></AuthProvider></BrowserRouter>);
};

describe('OrdersPage', () => {
  const orderSvc = require('../services/orderService').default;
  const warehouseSvc = require('../services/warehouseService').default;
  const shipmentSvc = require('../services/shipmentService').default;

  beforeEach(() => {
    localStorage.clear();
    orderSvc.getAllOrders.mockResolvedValue({ data: [] });
    warehouseSvc.getAllWarehouses.mockResolvedValue({ data: [] });
    warehouseSvc.getWarehouseDrivers.mockResolvedValue({ data: [] });
    shipmentSvc.getShipmentsByOrder.mockResolvedValue({ data: [] });
  });

  test('renders heading for admin', async () => { const { container } = renderOrders(); await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('All Orders')); await waitFor(() => expect(container.querySelector('.spinner')).not.toBeInTheDocument()); });
  test('calls getAllOrders on mount', async () => { const { container } = renderOrders(); await waitFor(() => expect(orderSvc.getAllOrders).toHaveBeenCalled()); await waitFor(() => expect(container.querySelector('.spinner')).not.toBeInTheDocument()); });
});
