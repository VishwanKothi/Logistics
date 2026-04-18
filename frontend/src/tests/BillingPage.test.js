import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import BillingPage from '../pages/BillingPage';

jest.mock('../services/billingService', () => ({ __esModule: true, default: {
  getWeeklyReport: jest.fn().mockResolvedValue({ data: { total_shipments: 50, delivered_count: 40, failed_count: 2, total_billing_amount: 120547 } }),
  getInvoicesByStatus: jest.fn().mockResolvedValue({ data: [] }),
} }));

const renderBilling = () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMIN' }));
  return render(<BrowserRouter><AuthProvider><BillingPage /></AuthProvider></BrowserRouter>);
};

describe('BillingPage', () => {
  beforeEach(() => localStorage.clear());
  test('renders billing page heading', async () => {
    renderBilling();
    await waitFor(() => expect(screen.getByText(/Billing/i)).toBeInTheDocument());
  });
  test('calls billing services on mount', async () => {
    const svc = require('../services/billingService').default;
    renderBilling();
    await waitFor(() => {
      expect(svc.getWeeklyReport).toHaveBeenCalled();
      expect(svc.getInvoicesByStatus).toHaveBeenCalled();
    });
  });
});
