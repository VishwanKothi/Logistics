import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';

jest.mock('../services/orderService', () => ({ __esModule: true, default: { getAllOrders: jest.fn() } }));
jest.mock('../services/shipmentService', () => ({ __esModule: true, default: { getActiveShipments: jest.fn(), getWarehouseShipments: jest.fn(), getDriverDeliveries: jest.fn() } }));
jest.mock('../services/exceptionService', () => ({ __esModule: true, default: { getOpenExceptions: jest.fn() } }));
jest.mock('../services/billingService', () => ({ __esModule: true, default: { getWeeklyReport: jest.fn() } }));
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => jest.fn() }));

const renderDashboard = () => {
  localStorage.setItem('token', 'tk');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Test Admin', email: 'a@t.com', role: 'ADMIN', warehouse: null }));
  return render(<BrowserRouter><AuthProvider><Dashboard /></AuthProvider></BrowserRouter>);
};

describe('Dashboard', () => {
  const orderSvc = require('../services/orderService').default;
  const shipmentSvc = require('../services/shipmentService').default;
  const exceptionSvc = require('../services/exceptionService').default;
  const billingSvc = require('../services/billingService').default;

  beforeEach(() => {
    localStorage.clear();
    orderSvc.getAllOrders.mockResolvedValue({ data: [] });
    shipmentSvc.getActiveShipments.mockResolvedValue({ data: [] });
    shipmentSvc.getWarehouseShipments.mockResolvedValue({ data: [] });
    shipmentSvc.getDriverDeliveries.mockResolvedValue({ data: [] });
    exceptionSvc.getOpenExceptions.mockResolvedValue({ data: [] });
    billingSvc.getWeeklyReport.mockResolvedValue({ data: {} });
  });

  test('renders quick action cards', async () => { const { container } = renderDashboard(); await waitFor(() => expect(screen.getByText('All Orders')).toBeInTheDocument()); await waitFor(() => expect(container.querySelector('.spinner')).not.toBeInTheDocument()); });
  test('renders billing card for admin', async () => { const { container } = renderDashboard(); await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument()); await waitFor(() => expect(container.querySelector('.spinner')).not.toBeInTheDocument()); });
});
