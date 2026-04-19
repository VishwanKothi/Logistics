import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import BillingPage from '../pages/BillingPage';

jest.mock('../services/billingService', () => ({
  __esModule: true,
  default: {
    getWeeklyReport: jest.fn(),
    getInvoicesByStatus: jest.fn(),
  }
}));

const renderBilling = () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMIN' }));
  return render(<BrowserRouter><AuthProvider><BillingPage /></AuthProvider></BrowserRouter>);
};

describe('BillingPage', () => {
  const billingSvc = require('../services/billingService').default;

  beforeEach(() => {
    localStorage.clear();
    billingSvc.getWeeklyReport.mockResolvedValue({ data: { total_shipments: 50, delivered_count: 40, failed_count: 2, total_billing_amount: 120547 } });
    billingSvc.getInvoicesByStatus.mockResolvedValue({ data: [] });
  });

  test('renders billing page heading', async () => {
    renderBilling();
    await waitFor(() => expect(screen.getByRole('heading', { name: /Billing & Invoices/i })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('50')).toBeInTheDocument());
  });
  test('calls billing services on mount', async () => {
    const svc = require('../services/billingService').default;
    renderBilling();
    await waitFor(() => {
      expect(svc.getWeeklyReport).toHaveBeenCalled();
      expect(svc.getInvoicesByStatus).toHaveBeenCalled();
    });
    await waitFor(() => expect(screen.getByText('50')).toBeInTheDocument());
  });
});
