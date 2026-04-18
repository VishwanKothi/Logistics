import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';

jest.mock('../services/orderService', () => ({ __esModule: true, default: { getAllOrders: jest.fn().mockResolvedValue({ data: [] }) } }));
jest.mock('../services/shipmentService', () => ({ __esModule: true, default: { getActiveShipments: jest.fn().mockResolvedValue({ data: [] }), getWarehouseShipments: jest.fn().mockResolvedValue({ data: [] }), getDriverDeliveries: jest.fn().mockResolvedValue({ data: [] }) } }));
jest.mock('../services/exceptionService', () => ({ __esModule: true, default: { getOpenExceptions: jest.fn().mockResolvedValue({ data: [] }) } }));
jest.mock('../services/billingService', () => ({ __esModule: true, default: { getWeeklyReport: jest.fn().mockResolvedValue({ data: {} }) } }));
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => jest.fn() }));

const renderDashboard = () => {
  localStorage.setItem('token', 'tk');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Test Admin', email: 'a@t.com', role: 'ADMIN', warehouse: null }));
  return render(<BrowserRouter><AuthProvider><Dashboard /></AuthProvider></BrowserRouter>);
};

describe('Dashboard', () => {
  beforeEach(() => localStorage.clear());
  test('renders quick action cards', async () => { renderDashboard(); await waitFor(() => expect(screen.getByText('All Orders')).toBeInTheDocument()); });
  test('renders billing card for admin', async () => { renderDashboard(); await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument()); });
});
