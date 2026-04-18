import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import OrdersPage from '../pages/OrdersPage';

jest.mock('../services/orderService', () => ({ __esModule: true, default: { getAllOrders: jest.fn().mockResolvedValue({ data: [] }), createOrder: jest.fn(), updateOrderStatus: jest.fn() } }));
jest.mock('../services/warehouseService', () => ({ __esModule: true, default: { getAllWarehouses: jest.fn().mockResolvedValue({ data: [] }), getWarehouseDrivers: jest.fn().mockResolvedValue({ data: [] }) } }));
jest.mock('../services/shipmentService', () => ({ __esModule: true, default: { getShipmentsByOrder: jest.fn().mockResolvedValue({ data: [] }) } }));

const renderOrders = (role = 'ADMIN') => {
  localStorage.setItem('token', 'tk');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Admin', email: 'a@t.com', role, warehouse_id: null }));
  return render(<BrowserRouter><AuthProvider><OrdersPage /></AuthProvider></BrowserRouter>);
};

describe('OrdersPage', () => {
  beforeEach(() => localStorage.clear());
  test('renders heading for admin', async () => { renderOrders(); await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('All Orders')); });
  test('calls getAllOrders on mount', async () => { const svc = require('../services/orderService').default; renderOrders(); await waitFor(() => expect(svc.getAllOrders).toHaveBeenCalled()); });
});
